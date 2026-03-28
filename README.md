# AcadeVote 🎓

A production-ready **blockchain-based academic voting system** built with Solidity, Node.js, React, and PostgreSQL. Votes are recorded on the Ethereum blockchain via server-side signing voters never interact with wallets or browser extensions. Personal identity data lives exclusively off-chain; only pseudonymous voter tokens go on-chain.

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Backend | Node.js, Express, ethers.js v6 |
| Frontend | React (Vite), Material UI v5, React Router v6 |
| Database | PostgreSQL 15 |
| Blockchain | Ethereum (local Hardhat node) |
| DevOps | Docker Compose |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React UI  │────▶│  Express API │────▶│  PostgreSQL   │
│  (Vite:5173)│     │  (:3001)     │     │  (:5432)      │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    Server-side signing
                           │
                    ┌──────▼───────┐
                    │  Hardhat Node │
                    │  (:8545)      │
                    └──────────────┘
```

**Three user roles:**

- **Admin** — Create/manage elections, manage voter eligibility, publish results
- **Voter** — View active elections, cast votes, view blockchain receipts
- **Auditor** — Review immutable audit logs, verify blockchain transactions

## Smart Contracts

| Contract | Purpose |
|---|---|
| `VoterRegistry` | Stores pseudonymous voter tokens on-chain |
| `ElectionFactory` | Deploys and tracks `VotingContract` instances |
| `VotingContract` | One instance per election — enforces timing, prevents double-voting, tallies results |

## Quick Start (Docker)

The easiest way to run AcadeVote. Docker Compose orchestrates all four services using official images (`node:20-slim`, `postgres:15-alpine`).

```bash
# Clone and start
git clone https://github.com/NadjibMoha/AcadeVote.git
cd AcadeVote
docker-compose up
```

The entrypoint script automatically:
1. Waits for Hardhat and PostgreSQL to be ready
2. Deploys smart contracts to the local chain
3. Runs database migrations
4. Seeds test users and sample elections
5. Starts the Express server

**Access the app:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

**Reset everything:**
```bash
docker-compose down -v
```

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Auditor | `auditor` | `auditor123` |
| Voter | `voter1` — `voter5` | `voter123` |

## Manual Setup (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- A running PostgreSQL database named `acadevote`

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

3. **Start Hardhat node** (terminal 1):
   ```bash
   npx hardhat node
   ```

4. **Deploy, migrate, and seed** (terminal 2):
   ```bash
   node server/db/migrate.js
   npx hardhat run scripts/deploy.js --network localhost
   npx hardhat run scripts/seed.js --network localhost
   ```

5. **Start backend** (terminal 2):
   ```bash
   cd server && npm run dev
   ```

6. **Start frontend** (terminal 3):
   ```bash
   cd client && npm run dev
   ```

## Project Structure

```
AcadeVote/
├── contracts/             # Solidity smart contracts
│   ├── VoterRegistry.sol
│   ├── VotingContract.sol
│   └── ElectionFactory.sol
├── test/                  # Hardhat contract tests
├── scripts/
│   ├── deploy.js          # Contract deployment
│   ├── seed.js            # Database + blockchain seeding
│   └── docker-entrypoint.sh
├── server/                # Express backend
│   ├── routes/            # API endpoints
│   ├── services/          # Blockchain & business logic
│   ├── middleware/         # Auth & error handling
│   └── db/                # PostgreSQL pool & migrations
├── client/                # React frontend
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Role-specific pages
│       ├── hooks/         # Custom React hooks
│       └── services/      # API client
├── docker-compose.yml     # Full-stack orchestration
└── hardhat.config.js
```

## Running Tests

```bash
npx hardhat test
```

## License

MIT
