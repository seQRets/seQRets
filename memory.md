# seQRets — Developer Memory File

> Quick-reference for AI assistants and future sessions. Last updated: v1.4.5 (March 7, 2026).

---

## Project Overview

**seQRets** is a zero-knowledge crypto inheritance app. Users enter a secret (seed phrase, private key, etc.), encrypt it client-side with XChaCha20-Poly1305 + Argon2id, split it via Shamir Secret Sharing into QR-code "Qards," and distribute those Qards to heirs. An optional inheritance plan (also encrypted) documents how to reassemble.

- **Monorepo** with npm workspaces: `packages/*`
- **Web app**: Next.js 16 (static export) at `src/`
- **Desktop app**: Tauri 2.10 + Vite + React at `packages/desktop/`
- **Shared crypto**: `@seqrets/crypto` at `packages/crypto/`
- **JavaCard applet**: `packages/javacard/` (smart card storage)
- **License**: AGPL-3.0-or-later
- **Repo**: https://github.com/seQRets/seQRets-app

---

## Architecture Quick Reference

### Directory Layout

```
/
├── src/                          # Next.js web app
│   ├── app/                      #   App Router pages & components
│   │   ├── components/           #   UI components (web)
│   │   ├── about/page.tsx        #   About page
│   │   ├── support/page.tsx      #   Ask Bob full page (web)
│   │   └── go-pro/page.tsx       #   Go Pro page
│   ├── ai/flows/                 #   Bob AI system prompt (web)
│   │   └── ask-bob-flow.ts
│   └── lib/                      #   Shared types & utilities
├── packages/
│   ├── crypto/                   # @seqrets/crypto (tsup build)
│   │   └── src/crypto.ts         #   XChaCha20 + Argon2id + Shamir
│   ├── desktop/                  # Tauri desktop app
│   │   ├── src/                  #   React frontend (Vite)
│   │   │   ├── components/       #     UI components (desktop)
│   │   │   ├── pages/            #     Route pages (react-router-dom)
│   │   │   ├── lib/              #     API wrappers, utilities
│   │   │   └── App.tsx           #     Router setup
│   │   └── src-tauri/            #   Rust backend
│   │       ├── src/
│   │       │   ├── main.rs       #     Tauri app entry
│   │       │   └── smartcard.rs  #     PC/SC smart card driver
│   │       ├── Cargo.toml
│   │       └── tauri.conf.json   #     Window config, app metadata
│   └── javacard/                 # JavaCard applet source
├── package.json                  # Root workspace config
├── tailwind.config.ts
├── tsconfig.json                 # Web: @/* → ./src/*
└── next.config.mjs
```

### Key Differences: Web vs Desktop

| Aspect | Web (Next.js) | Desktop (Tauri + Vite) |
|---|---|---|
| Router | Next.js App Router | react-router-dom (`BrowserRouter`) |
| API key storage | `localStorage` (sync) | OS keychain via Tauri IPC (async) |
| `getApiKey()` | Synchronous | `async` → returns `Promise<string\|null>` |
| Smart card | Not available | PC/SC via Rust backend |
| Bob AI prompt | `src/ai/flows/ask-bob-flow.ts` | `packages/desktop/src/lib/bob-api.ts` |
| Image component | `next/image` (`<Image>`) | `<img>` tag |
| Link component | `next/link` (`<Link href>`) | `react-router-dom` (`<Link to>`) |

### Bob AI (Gemini Integration)

Both web and desktop embed a multi-section system prompt as a template literal string in their respective `ask-bob-flow.ts` / `bob-api.ts` files. The prompt includes app features, security architecture, inheritance planning knowledge, and the current version. **Both files must be updated in sync** when changing Bob's knowledge.

Chat history: `localStorage['bob-chat-history']` — shared between the popover and full page via `StorageEvent` listener.

### Inheritance Plan

- **Data model**: `InheritancePlan` interface in `packages/desktop/src/lib/inheritance-plan-types.ts`
- **Current version**: 2 (v1→v2 added `deviceAccounts` field)
- **Migration**: `inheritance-plan-utils.ts` → `rawInstructionToPlan()` injects missing fields
- **8 sections**: Beneficiaries, Recovery Credentials, Device & Account Access, Qard Locations, Digital Assets, How to Restore, Professional Contacts, Personal Message
- **Encryption**: XChaCha20-Poly1305 + Argon2id pipeline, stored on smart card or file

### Smart Card (JavaCard)

- **Applet**: `packages/javacard/src/com/seqrets/card/SeQRetsApplet.java`
- **PIN system**: 5 attempts max, 8-16 character PIN, permanent lock at 0 retries
- **Recovery**: `forceEraseCard()` — factory reset always allowed without PIN
- **Multi-item storage**: Multiple items (shares, vaults, instructions) per card
- **Rust driver**: `packages/desktop/src-tauri/src/smartcard.rs`
- **Frontend**: `smartcard-dialog.tsx` (popover) + `SmartCardPage.tsx` (full page)

---

## Version Management

**All 13+ files must be updated for version bumps:**

```bash
# Quick find of version references (exclude node_modules, .git, lock files):
grep -r "1\.4\.3" --include="*.{json,toml,tsx,ts,md}" --exclude-dir={node_modules,.git,.next,out,target}

# Files to update:
package.json                                    # root
packages/crypto/package.json
packages/desktop/package.json
packages/desktop/src-tauri/Cargo.toml
packages/desktop/src-tauri/tauri.conf.json
src/ai/flows/ask-bob-flow.ts                    # Bob system prompt (web)
packages/desktop/src/lib/bob-api.ts             # Bob system prompt (desktop)
src/app/about/page.tsx                          # About page (web)
packages/desktop/src/pages/AboutPage.tsx         # About page (desktop)
src/app/components/app-footer.tsx                # Footer (web)
packages/desktop/src/components/app-footer.tsx   # Footer (desktop)
README.md
BUILDING.md
SECURITY_ANALYSIS.md

# Then regenerate lock files:
npm install --package-lock-only
cd packages/desktop/src-tauri && cargo generate-lockfile
```

**Caution**: Don't replace version strings in dependency references like `html2canvas: ^1.4.1` or `@jridgewell/sourcemap-codec: ^1.4.14`. Use targeted `sed` or manual replacement.

---

## Development Commands

```bash
# Web dev server (port 9002)
npm run dev

# Desktop dev server (Tauri + Vite)
cd packages/desktop && npm run tauri:dev
# or from root:
npm run desktop:dev

# TypeScript check (desktop)
npx tsc --noEmit -p packages/desktop/tsconfig.json

# TypeScript check (web)
npx tsc --noEmit

# Build crypto package (prerequisite for other builds)
npm run build:crypto

# Production build
npm run build              # web
npm run desktop:build      # desktop
```

**Note**: Tauri window config changes (`tauri.conf.json`) require a full restart of `tauri dev` — they don't hot-reload. CSS/React changes hot-reload via Vite HMR.

---

## Common Gotchas

1. **Desktop `getApiKey()` is async** — OS keychain access via Tauri IPC. This means `hasApiKey` starts as `null` on desktop, creating an async gap. The web version reads from localStorage synchronously. Components that depend on API key state need to handle the `null` (pending) state.

2. **Bob prompt files must stay in sync** — `ask-bob-flow.ts` (web) and `bob-api.ts` (desktop) have nearly identical system prompts. When updating Bob's knowledge, update BOTH.

3. **`h-full` doesn't work in flex parents** — CSS `height: 100%` doesn't resolve against flex-computed parent heights. Use `flex-1 min-h-0` for components inside flex containers (learned from the Ask Bob full page layout bug).

4. **html2canvas SVG issues** — html2canvas misrenders inline SVGs in PNG exports. Use emoji or text alternatives for icons in the QR card export template.

5. **React StrictMode** — Desktop uses `React.StrictMode` in `main.tsx`, causing double-mount in dev. Effects run twice. Keep effects idempotent.

6. **Working directory** — Some commands (`cargo generate-lockfile`) change cwd. Always use absolute paths or prefix with `cd /path &&` in scripts.

7. **Inheritance plan version migration** — When adding fields to `InheritancePlan`, bump `INHERITANCE_PLAN_VERSION` and add migration logic in `rawInstructionToPlan()`. Backward migration isn't needed (app hasn't been publicly released).

---

## UI Component Patterns

- **UI library**: shadcn/ui (Radix primitives + Tailwind)
- **Icons**: Lucide React
- **Theme**: Dark/light via `next-themes` (web) and custom `ThemeProvider` (desktop)
- **Toast**: `useToast()` hook from shadcn
- **Card pattern**: Digital Assets and Device & Account Access sections use repeatable card entries with add/remove functionality
- **QR card export**: HTML template string → `html2canvas` → PNG blob → download. Separate canvas-based renderer for the web version.

---

## Roadmap: Plausible Deniability (PD)

**Status**: Planned (not yet implemented)

### Concept
Dual-layer encryption within the same Shamir share set. One password/keyfile reveals the real secret; another reveals a convincing decoy. The app gives no indication a second layer exists.

### Architecture
```
Real secret   → Encrypt(real_credential)   → ciphertext_A
Decoy secret  → Encrypt(duress_credential) → ciphertext_B
                                             ↓
                              Combine A + B → Shamir Split → Qards
```
On restore, XChaCha20-Poly1305 authentication determines which ciphertext matches the entered credential. Only the matching secret is revealed.

### PD Variants
| Variant | Real Secret | Decoy Secret | Distinguisher |
|---|---|---|---|
| Dual password | password_A | password_B | Which password entered |
| Dual keyfile | password + keyfile_A | password + keyfile_B | Which keyfile provided |
| Keyfile vs none | password + keyfile | password alone | Whether keyfile provided |
| Dual password + keyfile | password_A + keyfile | password_B (no keyfile) | Both differ |

**Strongest variant**: "Keyfile vs none" — attacker gets a valid decoy with just the password, never knows a keyfile exists.

### Decoy Size Constraint
- **Decoy limited to ~128 bytes plaintext** (before compression/encryption)
- Fits: any 12-word seed (16 bytes entropy), short text notes, master passwords, brief instructions
- Keeps QR overhead to ~1.5x current size (not 2x) — critical for paper scanning reliability
- UI enforces the limit with a character/byte counter; decoy input is a flexible text field, not seed-only
- Use cases: sacrificial wallet seed, "the backup is in the freezer", password manager master password, etc.

### Critical Requirements
- **Fixed-size padding**: Decision deferred — may not pad non-PD shares at launch. PD-enabled shares would be padded to a fixed size. Accepting that PD vs non-PD shares may be distinguishable by size to preserve scanning reliability. Revisit when PD is built.
- **No UI hints**: Restore flow must never indicate whether PD is active or whether a second layer exists
- **QR size impact**: ~1.5x current size with 128-byte decoy cap (tested: current 24-word BIP-39 shares are ~129 chars, PD would be ~180-200 chars — well within reliable scanning range)
- **Open-source defense**: Padding (when used) makes PD usage undetectable even though the feature is visible in code (same argument as VeraCrypt hidden volumes)
- **Decoy plausibility**: User education needed — decoy wallet should hold a credible amount; short text secrets should be believable

### Implementation Notes
- Desktop-only feature (post-launch) — adds to desktop app value proposition over web
- Crypto pipeline stays the same — run it twice, concatenate before Shamir split
- Affects: `packages/desktop/` only (crypto, UI, restore flow)
- Needs new UI: optional PD toggle in Secure Secret, secondary secret input (text field, byte-limited), credential inputs per PD variant
- Restore flow: try entered credential against both ciphertexts, display whichever authenticates
- QR scanning tested with real printed Qards at current density — headroom exists for ~1.5x but 2x is risky on aged/inkjet paper
- **Large secret warning**: If projected QR share exceeds ~500 chars (e.g., wallet descriptors + PD), show UI warning recommending vault file or smart card export instead of QR Qards. Warning does not block — user can still proceed. Vault files and smart cards store raw ciphertext (no QR encoding), so size is irrelevant for those paths.

### QR Scanning Test Results (March 2026)
Tested with printed QR codes scanned via desktop webcam and phone camera:
| Payload | Chars | Reliability |
|---|---|---|
| 12-word BIP-39 | ~109 | ✅ Easy |
| 24-word BIP-39 | ~129 | ✅ Easy |
| 24-word + PD (128-byte cap) | ~225 | ✅ Comfortable |
| Long text (~200 bytes) | ~301 | ✅ Fine |
| Long text + PD | ~569 | ✅ Fine |
| Stress test (~600 bytes) | ~833 | ⚠️ Unreliable on paper |
- **Practical ceiling**: ~600 chars for reliable paper scanning
- **PD safe zone**: All BIP-39 + 128-byte decoy scenarios stay well under 300 chars

---

## Roadmap: Soft Expiration / Rotation Reminders

**Status**: Planned (not yet implemented)

### Concept
Optional expiration dates on keyfiles as a workflow nudge (not cryptographic enforcement). Encourages users to periodically regenerate shares, keeping the process fresh.

### Key Decisions
- Purely local — stored in localStorage (web) / OS keychain (desktop). No server, no email, no accounts.
- Soft enforcement only — app warns but still allows restore after expiry (hard lock risks permanent data loss)
- Hard cryptographic expiration is not feasible in an offline, zero-knowledge system

---

## Roadmap: Physical Qard Media & Export

**Status**: Planned (not yet implemented)

### Concept
Expand Qard export beyond paper printing to support durable physical media. QR codes are ideal for physical etching/engraving because they have built-in error correction and are binary (black/white), making them machine-readable even when produced by different fabrication methods.

### Durable Media Options
| Media | Durability | Method |
|---|---|---|
| Titanium | Fire, water, corrosion proof | Laser etching / CNC engraving |
| Stainless steel | Fire, water resistant | Laser etching / CNC engraving |
| Copper / Brass | Long-lasting, corrosion resistant | Chemical etching / laser |
| Carbon fiber | Lightweight, durable | Laser etching |
| Wood | Moderate | Laser engraving |

### Enhanced Paper Options
| Method | Benefit |
|---|---|
| Archival paper | Acid-free, rated 100+ years |
| Waterproof paper (e.g., Rite in the Rain) | Survives water damage |
| Lamination | Water + tear resistance |
| Laser printing (vs inkjet) | No ink bleed, better QR scanning long-term |

### Implementation Considerations
- Export formats needed: high-res PNG, SVG (vector — essential for laser etching), possibly DXF for CNC
- SVG export would be a new feature — current PNG export uses Canvas 2D rasterization
- QR error correction level may need to be configurable (higher = more resilient to surface damage but denser)
- Could partner with laser etching services or provide guides for DIY
- QR size constraints remain the same — durable media doesn't change scanning limits, only survival

---

## GitHub

- **Repo**: https://github.com/seQRets/seQRets-app
- **Releases**: https://github.com/seQRets/seQRets-app/releases
- **Branch protection**: Main branch has PR requirement (bypassed for direct pushes)
- **CLI**: `gh` authenticated and working for releases, PR creation, etc.
