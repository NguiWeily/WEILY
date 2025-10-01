# WEILY AI LP Portfolio Manager

This repo contains a runnable program of an **WEILY AI-assisted Liquidity Provider (LP) portfolio manager**.
It includes a simple backend (Node/Express) that uses the Alchemy SDK for on-chain reads, and a Vite + React frontend.

**What's included**
- `server/` - backend API (positions, generate-plan, execute-plan). Uses Alchemy and ethers.
- `frontend/` - minimal React app (Vite) with wallet connect UI placeholders and flows.

**Important**
Do not use private keys on the server. Always review security before running on mainnet.

## Quick start

### Backend
1. `cd server`
2. `npm install`
3. Create a `.env` with `ALCHEMY_API_KEY=your_key`
4. `node index.js`
Backend runs on `http://localhost:3001`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
Open the Vite URL (usually http://localhost:5173)

## Usage
1. In the frontend paste an address and click **Fetch positions**
2. Click **Ask AI** to generate a mock plan
3. Click **Prepare Execution** to receive unsigned tx placeholders

## Notes
- `server/index.js` includes simplified logic from the program described in the project. The LLM integration is mocked here for easy local tests.
- Replace CoinGecko and Chainlink integrations as needed.
- For a production implementation: add auth, persist data, validate LLM outputs, and never accept private keys.

