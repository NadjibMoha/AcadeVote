const { ethers } = require('hardhat');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("Seeding Database...");

  // Clean up previous seed data to prevent duplicates on restart
  console.log("Cleaning previous seed data...");
  await pool.query("DELETE FROM election_results");
  await pool.query("DELETE FROM voter_eligibility");
  await pool.query("DELETE FROM candidates");
  await pool.query("DELETE FROM elections");
  await pool.query("DELETE FROM audit_log");

  const adminHash = await bcrypt.hash('admin123', 12);
  const auditorHash = await bcrypt.hash('auditor123', 12);
  const voterHash = await bcrypt.hash('voter123', 12);

  // 1. Insert Users
  const usersToInsert = [
    { username: 'admin', email: 'admin@uni.edu', hash: adminHash, role: 'admin' },
    { username: 'auditor', email: 'auditor@uni.edu', hash: auditorHash, role: 'auditor' },
    { username: 'voter1', email: 'voter1@uni.edu', hash: voterHash, role: 'voter' },
    { username: 'voter2', email: 'voter2@uni.edu', hash: voterHash, role: 'voter' },
    { username: 'voter3', email: 'voter3@uni.edu', hash: voterHash, role: 'voter' },
    { username: 'voter4', email: 'voter4@uni.edu', hash: voterHash, role: 'voter' },
    { username: 'voter5', email: 'voter5@uni.edu', hash: voterHash, role: 'voter' }
  ];

  const userIds = {};
  for (const u of usersToInsert) {
    const voterToken = u.role === 'voter' ? crypto.randomBytes(8).readBigUInt64BE(0).toString() : null;
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, voter_token) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (username) DO UPDATE SET email=EXCLUDED.email RETURNING user_id, voter_token`,
      [u.username, u.email, u.hash, u.role, voterToken]
    );
    userIds[u.username] = { id: rows[0].user_id, token: rows[0].voter_token };
  }

  // Register voters on blockchain
  const voterTokens = [];
  for (let i = 1; i <= 5; i++) {
    voterTokens.push(userIds[`voter${i}`].token);
  }

  const voterRegistryAddress = process.env.VOTER_REGISTRY_ADDRESS;
  if (!voterRegistryAddress) {
    console.log("VOTER_REGISTRY_ADDRESS not set, skipping blockchain seeding part.");
    process.exit(0);
  }

  console.log("Registering tokens on blockchain...");
  const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
  const registry = VoterRegistry.attach(voterRegistryAddress);
  
  const tx = await registry.bulkRegisterVoters(voterTokens);
  await tx.wait();

  // 2. Insert Elections
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const ElectionFactory = await ethers.getContractFactory("ElectionFactory");
  const factory = ElectionFactory.attach(process.env.ELECTION_FACTORY_ADDRESS);

  console.log("Creating Active Election...");
  const tx1 = await factory.createElection(
    "Student Union President 2026",
    Math.floor(yesterday.getTime() / 1000),
    Math.floor(tomorrow.getTime() / 1000),
    ["Alice Smith", "Bob Jones", "Charlie Brown"],
    ["Platform A", "Platform B", "Platform C"],
    voterRegistryAddress
  );
  await tx1.wait();
  
  const electionsArray = await factory.getElections();
  const activeContract = electionsArray[electionsArray.length - 1];

  const { rows: e1Rows } = await pool.query(
    `INSERT INTO elections (title, description, start_time, end_time, status, contract_address, created_by)
     VALUES ($1, $2, $3, $4, 'active', $5, $6) RETURNING election_id`,
    ["Student Union President 2026", "Annual student union elections", yesterday, tomorrow, activeContract, userIds.admin.id]
  );
  const e1Id = e1Rows[0].election_id;

  const candidatesE1 = ["Alice Smith", "Bob Jones", "Charlie Brown"];
  for (let i=0; i<candidatesE1.length; i++) {
    await pool.query('INSERT INTO candidates (election_id, name, description, position) VALUES ($1, $2, $3, $4)',
      [e1Id, candidatesE1[i], `Platform ${String.fromCharCode(65+i)}`, i]);
  }

  for (let i = 1; i <= 5; i++) {
    await pool.query('INSERT INTO voter_eligibility (election_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [e1Id, userIds[`voter${i}`].id]);
  }

  console.log("Creating Draft Election...");
  const tx2 = await factory.createElection(
    "Department Rep Election",
    Math.floor(tomorrow.getTime() / 1000),
    Math.floor(nextWeek.getTime() / 1000),
    ["Diana Prince", "Clark Kent"],
    ["Science Rep", "Arts Rep"],
    voterRegistryAddress
  );
  await tx2.wait();
  const electionsArray2 = await factory.getElections();
  const draftContract = electionsArray2[electionsArray2.length - 1];

  const { rows: e2Rows } = await pool.query(
    `INSERT INTO elections (title, description, start_time, end_time, status, contract_address, created_by)
     VALUES ($1, $2, $3, $4, 'draft', $5, $6) RETURNING election_id`,
    ["Department Rep Election", "Departmental rep voting", tomorrow, nextWeek, draftContract, userIds.admin.id]
  );
  const e2Id = e2Rows[0].election_id;
  
  await pool.query('INSERT INTO candidates (election_id, name, description, position) VALUES ($1, $2, $3, $4)',
    [e2Id, "Diana Prince", "Science Rep", 0]);
  await pool.query('INSERT INTO candidates (election_id, name, description, position) VALUES ($1, $2, $3, $4)',
    [e2Id, "Clark Kent", "Arts Rep", 1]);

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
