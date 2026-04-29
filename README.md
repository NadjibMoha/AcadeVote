# AcadeVote 🎓

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> A production-ready, blockchain-integrated academic election platform. Votes are immutably recorded on Ethereum via server-side signing — voters never need wallets or browser extensions.

---

## About

AcadeVote brings tamper-proof transparency to academic elections. Personal identity data stays off-chain in PostgreSQL; only pseudonymous voter tokens go on-chain, giving you the auditability of a public blockchain without exposing student privacy.

Three roles keep everything organized: **Admins** run elections, **Voters** cast ballots, and **Auditors** independently verify every transaction on the blockchain.

---

## Architecture

```mermaid
flowchart LR
    subgraph Frontend
        UI[React / Vite\n:5173]
    end

    subgraph Backend
        API[Express API\n:3001]
        DB[(PostgreSQL\n:5432)]
    end

    subgraph Blockchain
        HH[Hardhat Node\n:8545]
        VR[VoterRegistry]
        EF[ElectionFactory]
        VC[VotingContract]
    end

    UI -->|HTTP / JWT| API
    API -->|SQL| DB
    API -->|Server-side signing\nethers.js v6| HH
    HH --> VR
    HH --> EF
    EF -->|deploys| VC
```

---

## Features

- **Blockchain-backed votes** — Each ballot is recorded on Ethereum; results are mathematically verifiable and immutable.
- **No wallet required** — The server signs transactions on behalf of voters using a dedicated private key, so users just log in with a username and password.
- **Privacy by design** — Voter identity stays in PostgreSQL; only pseudonymous tokens are published on-chain.
- **Role-based access control** — Separate dashboards and permissions for Admins, Voters, and Auditors.
- **Smart contract suite** — `VoterRegistry`, `ElectionFactory`, and per-election `VotingContract` instances enforce timing rules and prevent double-voting at the protocol level.
- **Full audit trail** — Auditors can review immutable on-chain logs and verify transactions independently.
- **One-command Docker setup** — `docker-compose up` boots all four services, deploys contracts, runs migrations, and seeds test data automatically.
- **Hardhat test suite** — Comprehensive contract tests runnable with a single command.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Backend | Node.js 20, Express, ethers.js v6 |
| Frontend | React (Vite), Material UI v5, React Router v6 |
| Database | PostgreSQL 15 |
| Blockchain | Ethereum (local Hardhat node) |
| DevOps | Docker Compose, Nginx |

---

## Smart Contracts

| Contract | Purpose |
|---|---|
| `VoterRegistry` | Stores pseudonymous voter tokens on-chain |
| `ElectionFactory` | Deploys and tracks `VotingContract` instances |
| `VotingContract` | One instance per election — enforces timing, prevents double-voting, tallies results |

---

## 🚀 Getting Started

### Option A — Docker (Recommended)

The only prerequisite is [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
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

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |

To reset all state (volumes included):

```bash
docker-compose down -v
```

---

### Option B — Manual Setup

#### Prerequisites

- Node.js 20+
- PostgreSQL 14+ with a database named `acadevote`

#### Installation

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/NadjibMoha/AcadeVote.git
   cd AcadeVote
   npm install
   cd server && npm install
   cd ../client && npm install && cd ..
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and secrets
   ```

3. **Start the Hardhat node** (terminal 1)

   ```bash
   npx hardhat node
   ```

4. **Deploy contracts, run migrations, and seed data** (terminal 2)

   ```bash
   node server/db/migrate.js
   npx hardhat run scripts/deploy.js --network localhost
   npx hardhat run scripts/seed.js --network localhost
   ```

5. **Start the backend** (terminal 2)

   ```bash
   cd server && npm run dev
   ```

6. **Start the frontend** (terminal 3)

   ```bash
   cd client && npm run dev
   ```

---

## Configuration

Copy `.env.example` to `.env` and fill in your values:

| Variable | Default / Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/acadevote` | PostgreSQL connection string |
| `JWT_SECRET` | `your-jwt-secret-here` | Secret used to sign auth tokens — change in production |
| `SERVER_PRIVATE_KEY` | Hardhat account #1 key | Ethereum private key used for server-side signing |
| `HARDHAT_RPC_URL` | `http://127.0.0.1:8545` | RPC endpoint of the Hardhat node |
| `VOTER_REGISTRY_ADDRESS` | Set after deployment | Deployed `VoterRegistry` contract address |
| `ELECTION_FACTORY_ADDRESS` | Set after deployment | Deployed `ElectionFactory` contract address |

> ⚠️ The default `SERVER_PRIVATE_KEY` is a well-known Hardhat test account. **Never use it on a public network.**

---

## Test Accounts

These accounts are seeded automatically (Docker or manual seed step):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Auditor | `auditor` | `auditor123` |
| Voter | `voter1` – `voter5` | `voter123` |

---

## Usage

### Voting Flow

```mermaid
sequenceDiagram
    participant V as Voter
    participant API as Express API
    participant DB as PostgreSQL
    participant BC as Hardhat / Ethereum

    V->>API: POST /auth/login
    API->>DB: Verify credentials
    API-->>V: JWT token

    V->>API: GET /elections (active)
    API-->>V: Election list

    V->>API: POST /elections/:id/vote {candidateId}
    API->>DB: Check eligibility & prevent double-vote
    API->>BC: Sign & submit transaction (server key)
    BC-->>API: Transaction hash
    API->>DB: Record vote + tx hash
    API-->>V: Blockchain receipt
```

### Running Contract Tests

```bash
npx hardhat test
```

---

## Project Structure

```
AcadeVote/
├── contracts/                 # Solidity smart contracts
│   ├── VoterRegistry.sol
│   ├── VotingContract.sol
│   └── ElectionFactory.sol
├── test/                      # Hardhat contract tests
├── scripts/
│   ├── deploy.js              # Contract deployment
│   ├── seed.js                # DB + blockchain seeding
│   └── docker-entrypoint.sh
├── server/                    # Express backend
│   ├── routes/                # API endpoints
│   ├── services/              # Blockchain & business logic
│   ├── middleware/            # Auth & error handling
│   └── db/                   # PostgreSQL pool & migrations
├── client/                    # React frontend
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── pages/             # Role-specific pages
│       ├── hooks/             # Custom React hooks
│       └── services/          # API client
├── docker-compose.yml         # Full-stack orchestration
├── nginx.conf                 # Reverse proxy config
└── hardhat.config.js
```

---




---

## License

This project is licensed under the [MIT License](LICENSE).
