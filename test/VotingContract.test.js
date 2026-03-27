const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VotingContract", function () {
  let voterRegistry, electionFactory, votingContract;
  let owner, voter1, voter2, nonVoter;
  let startTimestamp, endTimestamp;

  beforeEach(async function () {
    [owner, voter1, voter2, nonVoter] = await ethers.getSigners();

    const VoterRegistry = await ethers.getContractFactory("VoterRegistry");
    voterRegistry = await VoterRegistry.deploy();
    await voterRegistry.waitForDeployment();

    const ElectionFactory = await ethers.getContractFactory("ElectionFactory");
    electionFactory = await ElectionFactory.deploy();
    await electionFactory.waitForDeployment();

    startTimestamp = (await time.latest()) + 60; // Starts in 1 minute
    endTimestamp = startTimestamp + 3600; // 1 hour duration

    const candidates = ["Alice", "Bob"];
    const descriptions = ["Desc A", "Desc B"];

    const tx = await electionFactory.createElection(
      "Test Election",
      startTimestamp,
      endTimestamp,
      candidates,
      descriptions,
      await voterRegistry.getAddress()
    );
    await tx.wait();
    const electionAddress = await electionFactory.deployedElections(0);

    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = VotingContract.attach(electionAddress);
  });

  it("Should properly initialize", async function () {
    expect(await votingContract.startTime()).to.equal(startTimestamp);
    expect(await votingContract.endTime()).to.equal(endTimestamp);
    
    // Check candidates
    const candidate0 = await votingContract.candidates(0);
    expect(candidate0.name).to.equal("Alice");
    expect(candidate0.voteCount).to.equal(0n);
  });

  it("Should allow registered voter to cast vote", async function () {
    const voterToken = 12345n;
    await voterRegistry.registerVoter(voterToken);

    await time.increaseTo(startTimestamp + 10);

    await votingContract.castVote(voterToken, 0);

    const candidate0 = await votingContract.candidates(0);
    expect(candidate0.voteCount).to.equal(1n);
    expect(await votingContract.hasVoted(voterToken)).to.be.true;
  });

  it("Should prevent double voting", async function () {
    const voterToken = 12345n;
    await voterRegistry.registerVoter(voterToken);

    await time.increaseTo(startTimestamp + 10);

    await votingContract.castVote(voterToken, 0);

    await expect(
      votingContract.castVote(voterToken, 1)
    ).to.be.revertedWith("Voter has already voted");
  });

  it("Should enforce election timing", async function () {
    const voterToken = 12345n;
    await voterRegistry.registerVoter(voterToken);

    // Too early
    await expect(
      votingContract.castVote(voterToken, 0)
    ).to.be.revertedWith("Election has not started");

    // Too late
    await time.increaseTo(endTimestamp + 10);
    await expect(
      votingContract.castVote(voterToken, 0)
    ).to.be.revertedWith("Election has ended");
  });

  it("Should prevent unregistered voters from voting", async function () {
    await time.increaseTo(startTimestamp + 10);
    const voterToken = 999n;

    await expect(
      votingContract.castVote(voterToken, 0)
    ).to.be.revertedWith("Voter not registered");
  });

  it("Should publish and retrieve results correctly", async function () {
    const voterToken1 = 111n;
    const voterToken2 = 222n;
    
    await voterRegistry.bulkRegisterVoters([voterToken1, voterToken2]);

    await time.increaseTo(startTimestamp + 10);
    
    await votingContract.castVote(voterToken1, 0);
    await votingContract.castVote(voterToken2, 0);

    await time.increaseTo(endTimestamp + 10);

    await votingContract.publishResults();
    
    const [names, descs, counts] = await votingContract.getResults();
    expect(names[0]).to.equal("Alice");
    expect(counts[0]).to.equal(2n);
    expect(counts[1]).to.equal(0n);
  });
});
