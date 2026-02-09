# seQRets: Crypto Inheritance That Actually Works

seQRets is a hyper-secure, open-source application designed to protect your most sensitive digital information — from crypto seed phrases and private keys to passwords and other confidential data. It uses **Shamir's Secret Sharing** to split your secret into multiple QR codes called **Qards**.

To restore your original secret, you must bring a specific number of these Qards back together. This eliminates the single point of failure associated with storing secrets in one location, providing a robust solution for personal backup and cryptocurrency inheritance planning.

> **Version 0.9.0 "Pyre"** — Available as a web app (Next.js) and native desktop app (Tauri + Vite).

## Warning

**Your security is your responsibility.** seQRets gives you full control over your digital assets. Misplacing your password or the required number of Qards can result in the **permanent loss** of your secret. The developers have no access to your data, cannot recover your password, and cannot restore your secrets. Manage your Qards and password with extreme care.

## Features

### Secure Your Secret
- Enter any text-based secret (seed phrases, private keys, passwords, etc.)
- Encrypt with a strong password (24+ characters required)
- Optionally add a **keyfile** as a second factor — both password AND keyfile are required for recovery
- Split into configurable Qards (e.g., 2-of-3, 3-of-5 threshold)
- Download Qards as QR code images or export as a `.seqrets` vault file

### Restore Your Secret
- **Drag & drop** QR code images from your file system
- **Upload** Qard image files (PNG, JPG)
- **Scan** QR codes with your camera (desktop and web)
- **Manual text entry** — paste raw share data
- **Import vault file** — load all shares at once from a `.seqrets` file
- Success sound plays on each accepted share

### Helper Tools
- **Password Generator** — cryptographically secure 32-character passwords (88-character charset)
- **Seed Phrase Generator** — generate valid BIP-39 mnemonic phrases
- **Bitcoin Ticker** — live BTC/USD price display
- **Bob AI Assistant** — Google Gemini-powered AI for setup guidance and questions (optional, user-provided API key)

### BIP-39 Optimization
Seed phrases are automatically detected and converted to compact binary entropy before encryption. A 24-word phrase (~150 characters) becomes just 32 bytes, dramatically reducing QR code size.

## Security Architecture

All cryptographic operations run **entirely on your device**. Your secrets never leave your machine.

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| **Key Derivation** | Argon2id (64MB memory, 3 iterations) | Derive encryption key from password + optional keyfile |
| **Encryption** | XChaCha20-Poly1305 (AEAD) | Authenticated encryption with integrity verification |
| **Splitting** | Shamir's Secret Sharing | Threshold-based secret splitting into Qards |
| **Compression** | Gzip | Reduce payload size before encryption |
| **Memory** | Secure wipe | Overwrite sensitive data with random bytes after use |

**What gets split:** Only the fully encrypted data blob is split into shares — the raw secret is never split directly.

### Quantum Resistance

The built-in password generator produces passwords with ~10^62 possible combinations. Even with Grover's algorithm (optimal quantum speedup), brute-forcing would take:

- **Optimistic estimate:** ~2 × 10^18 years (148 million × the age of the universe)
- **Realistic estimate:** ~2 × 10^23 years (148 trillion × the age of the universe)

Argon2id's memory-hardness provides additional quantum resistance, and XChaCha20-Poly1305 maintains 128-bit effective quantum security as a defense-in-depth layer.

## Project Structure

seQRets is a monorepo with npm workspaces:

```
seQRets/
├── src/                     # Web app (Next.js 16 + React 19)
├── packages/
│   ├── crypto/              # @seqrets/crypto — shared cryptography library
│   │   └── src/             #   XChaCha20, Argon2id, Shamir's, BIP-39
│   └── desktop/             # @seqrets/desktop — Tauri v2 desktop app
│       ├── src/             #   React + Vite frontend
│       └── src-tauri/       #   Rust backend + macOS config
├── package.json             # Root workspace config
└── README.md
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Web App** | Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI |
| **Desktop App** | Tauri v2, Vite, React 19, TypeScript, Tailwind CSS, Radix UI |
| **Crypto Library** | @noble/ciphers, @noble/hashes, @scure/bip39, shamirs-secret-sharing-ts |
| **AI Assistant** | Google Gemini (via @google/generative-ai) |
| **QR Codes** | qrcode (generate), jsQR (decode) |

## Getting Started

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Rust** (for desktop app only) — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### Setup

```bash
git clone https://github.com/jalapeno4332/seQRets.git
cd seQRets
npm install
```

### Run the Web App

```bash
npm run dev
```

Opens at [http://localhost:9002](http://localhost:9002). All core features work offline — no API keys needed.

### Run the Desktop App

```bash
source ~/.cargo/env    # if Rust was just installed
npm run desktop:dev
```

### Build the Desktop Installer (.dmg)

```bash
npm run desktop:build
```

Produces `seQRets_0.9.0_aarch64.dmg` in `packages/desktop/src-tauri/target/release/bundle/dmg/`.

### Optional: Bob AI Assistant

Bob is an AI assistant that can answer questions about seQRets, Bitcoin security, and inheritance planning. It's entirely optional.

- **Web app:** Set `GEMINI_API_KEY` in a `.env.local` file at the project root
- **Desktop app:** Click "Ask Bob" → follow the setup guide to enter your free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Your API key is stored locally and never sent to any server other than Google's Gemini API.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web app dev server (port 9002) |
| `npm run build` | Build web app for production |
| `npm run build:crypto` | Build the shared crypto package |
| `npm run desktop:dev` | Run Tauri desktop app in dev mode |
| `npm run desktop:build` | Build desktop .dmg installer |
| `npm run lint` | Run linter |
| `npm run type-check` | TypeScript type checking |

## How It Works

### Encrypting a Secret

1. **Enter** your secret (seed phrase, private key, password, or any text)
2. **Secure** it with a strong password (and optional keyfile)
3. **Split** into your chosen Qard configuration (e.g., 2-of-3)
4. **Download** your Qards as QR images, a ZIP, or a `.seqrets` vault file

### Restoring a Secret

1. **Add** the required number of Qards (drag-drop, upload, camera scan, or manual entry)
2. **Enter** your password (and keyfile if used during encryption)
3. **Restore** — your original secret is revealed

## Contributing

This project is open source. Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request.

## License

MIT
