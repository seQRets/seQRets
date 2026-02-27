# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.3.x   | Yes       |
| < 1.3   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in seQRets, **please report it responsibly**. Do not open a public GitHub issue.

**Email:** [security@seqrets.app](mailto:security@seqrets.app)

Include as much of the following as possible:

- Description of the vulnerability
- Steps to reproduce
- Affected component (web app, desktop app, `@seqrets/crypto` library)
- Potential impact
- Suggested fix (if any)

## What to Expect

- **Acknowledgment** within 48 hours
- **Assessment and triage** within 7 days
- **Fix or mitigation** as soon as practical, depending on severity
- **Credit** in release notes (unless you prefer to remain anonymous)

## Scope

The following are in scope:

- Cryptographic implementation flaws (XChaCha20-Poly1305, Argon2id, Shamir's Secret Sharing)
- Secret or key material leakage (memory, DOM, network, logs)
- Share reconstruction with fewer than the required threshold
- Input validation bypasses
- Cross-site scripting (XSS) or injection in the web app
- Tauri IPC or privilege escalation in the desktop app

The following are **out of scope**:

- Vulnerabilities in upstream dependencies (report those to the upstream maintainer, but feel free to notify us)
- Browser extension threats (documented in README as a known limitation)
- Attacks requiring physical access to the user's device
- Social engineering

## Audit Status

seQRets v1.3.x has **not undergone a formal third-party security audit**. The cryptographic primitives used are industry-standard and well-audited (Noble, Scure libraries by Paul Miller), but the integration and application-level code has not been independently reviewed. A formal audit is planned.

## Security Design

For details on the cryptographic architecture, threat model, and security trade-offs, see the [Security Architecture](README.md#-security-architecture) and [App Security](README.md#%EF%B8%8F-app-security) sections of the README.
