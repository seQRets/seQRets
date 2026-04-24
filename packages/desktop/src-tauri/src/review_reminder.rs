//! Review-reminder sidecar storage for the inheritance plan.
//!
//! A plaintext JSON file in the Tauri app data directory that records when
//! the user should next be nudged to review their inheritance plan. All
//! policy (intervals, snooze logic, state machine) lives in TypeScript —
//! this module is a dumb, hardened file I/O bridge.
//!
//! Security posture (intentional, see docs/ARCHITECTURE.md#review-reminder-sidecar):
//! - Contents are plaintext. The sidecar stores only a date, not plan data.
//! - `deny_unknown_fields` on the serde struct so malformed / attacker-crafted
//!   JSON is rejected at the parse boundary instead of silently absorbed.
//! - Hard 4 KB size cap before parsing — refuses JSON bombs.
//! - Parse errors are surfaced, never silently deleted. An attacker who can
//!   write garbage should NOT be able to reset reminder state just by
//!   corrupting the file.
//! - Writes are atomic (write-to-temp + rename) with mode 0600 on unix.
//! - Symlink attacks are blocked: we refuse to read or write anything that
//!   isn't a regular file, and open-for-write uses O_NOFOLLOW on unix.

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const SIDECAR_FILENAME: &str = "review-reminder.json";
/// Hard cap on sidecar size. A healthy record is well under 512 bytes;
/// 4 KB leaves comfortable headroom without enabling JSON bombs.
const MAX_SIDECAR_BYTES: u64 = 4 * 1024;

/// Serde-level schema for the sidecar file. All date fields are ISO
/// `YYYY-MM-DD` strings; all business logic is in the TypeScript state
/// machine. `deny_unknown_fields` hardens the parser against injected keys.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ReminderSidecar {
    pub enabled: bool,
    pub interval_months: Option<u32>,
    pub last_reviewed_at: Option<String>,
    pub next_review_at: Option<String>,
    pub snoozed_until: Option<String>,
    pub os_notifications: bool,
}

fn sidecar_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Could not create app data dir: {e}"))?;
    Ok(dir.join(SIDECAR_FILENAME))
}

/// Refuse anything that isn't a regular file. Blocks symlink swaps that
/// could otherwise redirect our reads or writes to arbitrary paths.
fn ensure_regular_file(path: &Path) -> Result<bool, String> {
    match fs::symlink_metadata(path) {
        Ok(meta) => {
            let ft = meta.file_type();
            if ft.is_symlink() {
                return Err(format!(
                    "Refusing to touch sidecar: path is a symlink ({})",
                    path.display()
                ));
            }
            if !ft.is_file() {
                return Err(format!(
                    "Refusing to touch sidecar: path is not a regular file ({})",
                    path.display()
                ));
            }
            Ok(true)
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(e) => Err(format!("Could not stat sidecar: {e}")),
    }
}

/// Read and parse the sidecar.
///
/// Returns:
/// - `Ok(None)` if the file does not exist (normal "no reminder" state).
/// - `Err(..)` if the file exists but fails validation (size, type, parse,
///   unknown fields). The caller MUST surface the error rather than
///   silently recreating the file.
#[tauri::command]
pub fn reminder_read(app: AppHandle) -> Result<Option<ReminderSidecar>, String> {
    let path = sidecar_path(&app)?;

    if !ensure_regular_file(&path)? {
        return Ok(None);
    }

    let meta = fs::metadata(&path)
        .map_err(|e| format!("Could not stat sidecar: {e}"))?;
    if meta.len() > MAX_SIDECAR_BYTES {
        return Err(format!(
            "Sidecar is {} bytes; refusing to parse anything larger than {} bytes",
            meta.len(),
            MAX_SIDECAR_BYTES
        ));
    }

    let bytes = fs::read(&path)
        .map_err(|e| format!("Could not read sidecar: {e}"))?;

    let sidecar: ReminderSidecar = serde_json::from_slice(&bytes)
        .map_err(|e| format!("Sidecar parse error: {e}"))?;

    Ok(Some(sidecar))
}

/// Write the sidecar atomically: serialize → write to sibling temp file
/// → rename over the target. On unix the temp file is created with mode
/// 0600 and `O_NOFOLLOW` semantics so symlinks can't redirect the write.
#[tauri::command]
pub fn reminder_write(app: AppHandle, sidecar: ReminderSidecar) -> Result<(), String> {
    let path = sidecar_path(&app)?;

    // Reject pre-existing non-regular targets. If nothing is there yet, fine.
    let _ = ensure_regular_file(&path)?;

    let serialized = serde_json::to_vec_pretty(&sidecar)
        .map_err(|e| format!("Could not serialize sidecar: {e}"))?;

    if serialized.len() as u64 > MAX_SIDECAR_BYTES {
        return Err(format!(
            "Refusing to write {}-byte sidecar (cap is {} bytes)",
            serialized.len(),
            MAX_SIDECAR_BYTES
        ));
    }

    let tmp_path = path.with_extension("json.tmp");

    // Best-effort cleanup of a stray temp file from a previous crashed write.
    if tmp_path.exists() {
        let _ = fs::remove_file(&tmp_path);
    }

    {
        let mut opts = fs::OpenOptions::new();
        opts.write(true).create_new(true);

        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            // 0600: owner-only. O_NOFOLLOW: never follow a symlink at open time.
            opts.mode(0o600);
            opts.custom_flags(libc::O_NOFOLLOW);
        }

        let mut f = opts
            .open(&tmp_path)
            .map_err(|e| format!("Could not create sidecar temp file: {e}"))?;
        f.write_all(&serialized)
            .map_err(|e| format!("Could not write sidecar temp file: {e}"))?;
        f.sync_all()
            .map_err(|e| format!("Could not fsync sidecar temp file: {e}"))?;
    }

    fs::rename(&tmp_path, &path)
        .map_err(|e| format!("Could not finalize sidecar write: {e}"))?;

    Ok(())
}

/// Delete the sidecar. Idempotent — missing file is not an error.
/// Refuses to delete a path that has been replaced by a symlink or
/// directory.
#[tauri::command]
pub fn reminder_delete(app: AppHandle) -> Result<(), String> {
    let path = sidecar_path(&app)?;

    if !ensure_regular_file(&path)? {
        return Ok(());
    }

    fs::remove_file(&path)
        .map_err(|e| format!("Could not delete sidecar: {e}"))
}
