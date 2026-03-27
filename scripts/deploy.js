const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const VoterRegistry = await hre.ethers.getContractFactory("VoterRegistry");
  const voterRegistry = await VoterRegistry.deploy();
  await voterRegistry.waitForDeployment();
  const voterRegistryAddress = await voterRegistry.getAddress();
  console.log("VoterRegistry deployed to:", voterRegistryAddress);

  const ElectionFactory = await hre.ethers.getContractFactory("ElectionFactory");
  const electionFactory = await ElectionFactory.deploy();
  await electionFactory.waitForDeployment();
  const electionFactoryAddress = await electionFactory.getAddress();
  const fs = require('fs');
  const envPath = '.env';
  let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  // Remove any old contract address lines
  existing = existing
    .replace(/^VOTER_REGISTRY_ADDRESS=.*$/gm, '')
    .replace(/^ELECTION_FACTORY_ADDRESS=.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const envContent = `\nVOTER_REGISTRY_ADDRESS=${voterRegistryAddress}\nELECTION_FACTORY_ADDRESS=${electionFactoryAddress}\n`;
  fs.writeFileSync(envPath, existing + envContent);
  console.log("Written addresses to .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
