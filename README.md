# EIPChecker — Smart Contract Standards Inspector

[![Network: BOTChain Testnet](https://img.shields.io/badge/Network-BOTChain%20Testnet%20(968)-blue.svg)](https://scan.bohr.life/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Reown AppKit](https://img.shields.io/badge/Reown-AppKit%20v1.6-blue.svg)](https://reown.com/)
[![Gas Fee Only](https://img.shields.io/badge/Policy-Gas%20Fee%20Only-emerald.svg)](#economic-policy-gas-fee-only)

> **Core Problem**: A smart contract can claim to implement an Ethereum standard without correctly supporting its expected behavior.  
> **Crucial Takeaway**: *ERC-165 support alone does not prove full standard compliance.*

**EIPChecker** is a deterministic runtime standards inspector and on-chain compatibility directory built for **BOTChain Testnet**. It performs deep behavioral analysis, verifies method and event availability, detects spec-breaking quirks, and records verified reports to an on-chain registry under a **Gas-Fee-Only** policy.

📖 **Read the full [Technical Whitepaper](./WHITEPAPER.md)**

---

## 🔍 What It Does

- **ERC-20 Inspection & USDT Quirk Detection**: Checks `totalSupply`, `balanceOf`, `allowance`, and metadata (`name`, `symbol`, `decimals`). Performs low-level simulation of `transfer` to catch the famous **USDT Quirk** (returning `void` / 0 bytes instead of a 32-byte `bool`).
- **ERC-721 Revert Mandate Verification**: Checks interface `0x80ac58cd`, metadata `0x5b5e139f`, and verifies that querying `ownerOf` for nonexistent token IDs strictly **throws/reverts** as mandated by EIP-721 (rather than returning `address(0)`).
- **ERC-1155 Multi-Token Compatibility**: Tests interface `0xd9b67a26`, URI metadata, and batch query methods.
- **ERC-165 True Negative Testing**: Validates self-declaration (`0x01ffc9a7`) AND enforces the mandatory negative vector (`supportsInterface(0xffffffff)` must return `false`).
- **BOT Chain Compatibility Directory**: A live, on-chain directory indexed in `EIPCheckerRegistry.sol` showing standards compliance scores, diagnostic bitmasks, and inspector attestations.

---

## ⚡ Economic Policy: Gas Fee Only

Every check, inspection, and recording function interacts with the contract via network **gas fees only**:
- **Zero Protocol Fees**: The contract enforces `msg.value == 0`. No developer tax, token paywalls, or fees.
- **Pre-flight Gas Protection**: The app checks for deployed bytecode before sending a transaction. If an un-deployed or EOA address is entered, the transaction is blocked client-side to save your gas.

---

## 🚀 Deployed Contracts on BOTChain Testnet (Chain ID: 968)

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **`EIPCheckerRegistry.sol`** | `0x102888800e59ef5698dfc3d2768c489c9903c396` | [View on BOHR Scan](https://scan.bohr.life/address/0x102888800e59ef5698dfc3d2768c489c9903c396) |
| **Standard ERC-20 (`BSTT`)** | `0x011b3f1df87355c5596f57751289fa3e23b0cc1b` | [View on BOHR Scan](https://scan.bohr.life/address/0x011b3f1df87355c5596f57751289fa3e23b0cc1b) |
| **USDT-Quirk Demo Token** | `0x05c9a52b29e58ee799872d86150e61e6e0af4ae1` | [View on BOHR Scan](https://scan.bohr.life/address/0x05c9a52b29e58ee799872d86150e61e6e0af4ae1) |

- **RPC URL**: `https://rpc.bohr.life`
- **Native Token**: `BOT`
- **Block Explorer**: `https://scan.bohr.life/`

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity `^0.8.20`, compiled with `solc` (`viaIR: true`).
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS (Classic White & Blue Theme).
- **Web3 Connectivity**: `@reown/appkit`, `@reown/appkit-adapter-wagmi`, `wagmi@2.x`, `viem`, `@tanstack/react-query`.
- **Icons & UI**: `lucide-react`.

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/webtrovert0x/eipchecker.git
cd eipchecker
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration in `.env`:
```env
# Reown Project ID (from https://cloud.reown.com)
REOWN_ID=your_reown_project_id

# Private key for contract deployment (gas fee only)
PRIVATE_KEY=0xYourPrivateKeyHere

# Deployed registry address on BOTChain Testnet
NEXT_PUBLIC_REGISTRY_ADDRESS=0x102888800e59ef5698dfc3d2768c489c9903c396
```
*(Note: `REOWN_ID` is safely retrieved server-side via `/api/config` and never exposed into public client bundle builds).*

### 3. Compile & Deploy
```bash
# Compile contracts with solc
npm run compile

# Deploy to BOTChain Testnet (gas fee only)
npm run deploy
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
MIT License. Free to use, fork, and build upon.
