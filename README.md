# AcadeVote 🎓

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> A production-ready, blockchain-integrated academic election platform. Votes are recorded immutably on Ethereum — no wallets or browser extensions required for voters.

---

## Overview

AcadeVote brings verifiable, tamper-proof elections to academic institutions. It combines a traditional web application with Ethereum smart contracts: voters authenticate normally through a web UI, and the server signs and submits votes on-chain on their behalf. Personal identity data stays exclusively off-chain in PostgreSQL; only pseudonymous tokens ever touch the blockchain.

The result is an election system that is both accessible to non-technical users and cryptographically auditable by anyone.

---

## Features

- **Blockchain-backed votes** — each vote is submitted as an on-chain transaction, making results independently verifiable and tamper-evident
- **No wallet required** — server-side signing means voters only need a username and password; MetaMask and similar tools are never needed
- **Privacy by design** — voter identities live only in PostgreSQL; the blockchain stores pseudonymous tokens
- **Three distinct roles** — Admin, Voter, and Auditor with purpose-built interfaces for each
- **Full election lifecycle** — Admins create elections, set candidate lists, manage voter eligibility, and publish results
- **Blockchain receipts** — voters receive a transaction hash after casting their vote, enabling independent verification
- **Immutable audit log** — Auditors can inspect every on-chain transaction and verify election integrity
- **Double-vote prevention** — enforced at the smart contract level; no vote can be cast twice from the same token
- **Election timing enforcement** — contracts reject votes submitted outside the configured start/end window
- **Docker Compose setup** — one command spins up all four services (Hardhat node, PostgreSQL, backend, frontend) with automatic seeding

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    React UI      │────▶│   Express API     │────▶│   PostgreSQL    │
│  (Vite · :5173) │     │   (ethers.js v6)  │     │   (:5432)       │
│                  │     │   (:3001)         │     │  Identity data  │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                      Server-side wallet signing
                                 │
                        ┌────────▼─────────┐
                        │   Hardhat Node    │
                        │   (:8545)         │
                        │  Smart Contracts  │
                        └──────────────────┘
```

### User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Create and manage elections, configure candidates, manage voter eligibility, publish results |
| **Voter** | Browse active elections, cast votes, view blockchain transaction receipts |
| **Auditor** | Review immutable audit logs, verify on-chain transactions, inspect election integrity |

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `VoterRegistry` | Stores pseudonymous voter tokens on-chain |
| `ElectionFactory` | Deploys and tracks individual `VotingContract` instances |
| `VotingContract` | One instance per election — enforces timing, prevents double-voting, tallies results |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Backend | Node.js 20, Express, ethers.js v6 |
| Frontend | React (Vite), Material UI v5, React Router v6 |
| Database | PostgreSQL 15 |
| Testing & Auditing | Jest, Supertest, Hardhat, Slither, k6 |
| Blockchain | Ethereum (local Hardhat node) |
| Infrastructure | Docker Compose, Nginx |

---

## 🚀 Quick Start (Docker — Recommended)

Docker Compose orchestrates all services automatically. The entrypoint script waits for dependencies, deploys contracts, runs migrations, seeds test data, and starts the server.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Steps

```bash
git clone https://github.com/NadjibMoha/AcadeVote.git
cd AcadeVote
docker-compose up
```

That's it. The startup script automatically:

1. Waits for the Hardhat node and PostgreSQL to be ready
2. Deploys all smart contracts to the local chain
3. Runs database migrations
4. Seeds test users and sample elections
5. Starts the Express API server

**Access the app:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Hardhat RPC | http://localhost:8545 |

**Reset all data:**

```bash
docker-compose down -v
```

---

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ with a database named `acadevote`

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NadjibMoha/AcadeVote.git
   cd AcadeVote
   ```

2. **Install all dependencies**

   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your values (see Configuration section below)
   ```

4. **Start the Hardhat local node** (Terminal 1)

   ```bash
   npx hardhat node
   ```

5. **Run migrations, deploy contracts, and seed data** (Terminal 2)

   ```bash
   node server/db/migrate.js
   npx hardhat run scripts/deploy.js --network localhost
   npx hardhat run scripts/seed.js --network localhost
   ```

6. **Start the backend** (Terminal 2)

   ```bash
   cd server && npm run dev
   ```

7. **Start the frontend** (Terminal 3)

   ```bash
   cd client && npm run dev
   ```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/acadevote` |
| `JWT_SECRET` | Secret key for signing JWT tokens | A long random string |
| `SERVER_PRIVATE_KEY` | Ethereum private key used for server-side signing | `0x59c6995e...` (use Hardhat test key for local dev) |
| `HARDHAT_RPC_URL` | RPC endpoint for the Ethereum node | `http://127.0.0.1:8545` |
| `VOTER_REGISTRY_ADDRESS` | Deployed address of `VoterRegistry` contract | Set automatically after `deploy.js` runs |
| `ELECTION_FACTORY_ADDRESS` | Deployed address of `ElectionFactory` contract | Set automatically after `deploy.js` runs |

> ⚠️ **Never use the default `SERVER_PRIVATE_KEY` in production.** It is a well-known Hardhat test key. Generate a fresh key for any real deployment.

---

## Test Accounts

Pre-seeded accounts are available immediately after startup:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Auditor | `auditor` | `auditor123` |
| Voter | `voter1` – `voter5` | `voter123` |

---

## Project Structure

```
AcadeVote/
├── contracts/                  # Solidity smart contracts
│   ├── VoterRegistry.sol       # On-chain voter token registry
│   ├── ElectionFactory.sol     # Deploys and tracks election contracts
│   └── VotingContract.sol      # Per-election voting logic
├── test/                       # Hardhat contract unit tests
├── scripts/
│   ├── deploy.js               # Contract deployment script
│   ├── seed.js                 # Database + blockchain seeding
│   └── docker-entrypoint.sh   # Docker startup orchestration
├── server/                     # Express.js backend
│   ├── routes/                 # REST API endpoints
│   ├── services/               # Blockchain interaction & business logic
│   ├── middleware/             # JWT auth & error handling
│   └── db/                    # PostgreSQL pool, migrations
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── components/         # Shared UI components
│       ├── pages/              # Role-specific page views
│       ├── hooks/              # Custom React hooks
│       └── services/           # Axios API client
├── .env.example                # Environment variable template
├── docker-compose.yml          # Full-stack service orchestration
├── hardhat.config.js           # Hardhat network & compiler config
└── nginx.conf                  # Reverse proxy configuration
```

---

## Testing & Auditing

AcadeVote features a comprehensive suite of testing and auditing tools to ensure security and performance.

### Smart Contract Tests
Run the Hardhat blockchain test suite:
```bash
npx hardhat test
```

### Backend Unit Tests
Run the Jest and Supertest unit testing suite for the Express backend (Achieves 100% statement coverage on core services):
```bash
cd server
npm test -- --coverage
```

### Vulnerability Analysis (Slither)
Run the Slither static analyzer to audit the Solidity smart contracts for vulnerabilities:
```bash
# Requires Python 3
python3 -m venv .venv
source .venv/bin/activate
pip install slither-analyzer
slither .
```

### Load Testing (k6)
Run the k6 load testing script to simulate concurrent voter traffic against the backend API. 
*(Ensure your backend is running locally before executing)*
```bash
# Download k6 (Linux example)
wget https://github.com/grafana/k6/releases/download/v0.50.0/k6-v0.50.0-linux-amd64.tar.gz
tar -xzf k6-v0.50.0-linux-amd64.tar.gz
mv k6-v0.50.0-linux-amd64/k6 .

# Run the test
./k6 run load-test.js
```

---

## Security Considerations

- **Server wallet key** — the `SERVER_PRIVATE_KEY` controls all on-chain transactions. Protect it with a secrets manager in production (e.g., AWS Secrets Manager, HashiCorp Vault). Never commit it to version control.
- **Off-chain identity** — voter names and credentials never leave PostgreSQL, preserving privacy even if the blockchain is publicly inspected.
- **Contract-level enforcement** — double-vote prevention and election timing are enforced in Solidity, not just in the API layer, making them resistant to server-side bypass.

---

## Roadmap

- [ ] Support for Ethereum testnets and mainnet deployment
- [ ] Email notifications for election open/close events
- [ ] Candidate profile pages with uploaded photos
- [ ] Multi-institution support with tenant isolation
- [ ] Public result verification portal (no login required)
- [ ] CI/CD pipeline with automated contract and API tests

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please make sure contract changes are accompanied by Hardhat tests.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Hardhat](https://hardhat.org/) — Ethereum development environment
- [OpenZeppelin](https://openzeppelin.com/contracts/) — Audited Solidity contract libraries
- [ethers.js](https://docs.ethers.org/v6/) — Ethereum JavaScript library
- [Material UI](https://mui.com/) — React component library
