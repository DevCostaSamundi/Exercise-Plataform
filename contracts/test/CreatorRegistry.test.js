const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CreatorRegistry", function () {
  let registry;
  let owner, creator1, creator2, user1, user2;

  beforeEach(async function () {
    [owner, creator1, creator2, user1, user2] = await ethers.getSigners();

    const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    registry = await CreatorRegistry.deploy();
  });

  describe("Registration", function () {
    it("Should register creator successfully", async function () {
      await registry.connect(creator1).registerCreator(
        "Test Creator",
        "I create tokens",
        "https://example.com",
        "@testcreator",
        "@testcreator_tg"
      );

      expect(await registry.isRegistered(creator1.address)).to.be.true;
      expect(await registry.totalCreators()).to.equal(1);
    });

    it("Should emit CreatorRegistered event", async function () {
      await expect(
        registry.connect(creator1).registerCreator(
          "Test Creator",
          "Bio",
          "",
          "",
          ""
        )
      ).to.emit(registry, "CreatorRegistered");
    });

    it("Should fail if already registered", async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
      
      await expect(
        registry.connect(creator1).registerCreator("Creator 1 Again", "", "", "", "")
      ).to.be.revertedWith("Already registered");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        registry.connect(creator1).registerCreator("", "", "", "", "")
      ).to.be.revertedWith("Name required");
    });

    it("Should fail if name too long", async function () {
      const longName = "a".repeat(51);
      
      await expect(
        registry.connect(creator1).registerCreator(longName, "", "", "", "")
      ).to.be.revertedWith("Name too long");
    });

    it("Should fail if bio too long", async function () {
      const longBio = "a".repeat(501);
      
      await expect(
        registry.connect(creator1).registerCreator("Name", longBio, "", "", "")
      ).to.be.revertedWith("Bio too long");
    });

    it("Should track creator in list", async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
      await registry.connect(creator2).registerCreator("Creator 2", "", "", "", "");
      
      expect(await registry.creators(0)).to.equal(creator1.address);
      expect(await registry.creators(1)).to.equal(creator2.address);
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator(
        "Creator 1",
        "Original bio",
        "",
        "",
        ""
      );
    });

    it("Should update profile successfully", async function () {
      await registry.connect(creator1).updateProfile(
        "Updated Name",
        "Updated bio",
        "https://new.com",
        "@new",
        "@new_tg"
      );

      const profile = await registry.getProfile(creator1.address);
      expect(profile.name).to.equal("Updated Name");
      expect(profile.bio).to.equal("Updated bio");
    });

    it("Should emit ProfileUpdated event", async function () {
      await expect(
        registry.connect(creator1).updateProfile("Name", "", "", "", "")
      ).to.emit(registry, "ProfileUpdated");
    });

    it("Should fail if not registered", async function () {
      await expect(
        registry.connect(user1).updateProfile("Name", "", "", "", "")
      ).to.be.revertedWith("Not registered");
    });

    it("Should fail if banned", async function () {
      await registry.banCreator(creator1.address, "Bad behavior");
      
      await expect(
        registry.connect(creator1).updateProfile("Name", "", "", "", "")
      ).to.be.revertedWith("Banned");
    });
  });

  describe("Rating System", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
    });

    it("Should rate creator successfully", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "Great!");

      const stats = await registry.getStats(creator1.address);
      expect(stats.totalRatings).to.equal(1);
      expect(stats.averageRating).to.equal(500); // 5.00 * 100
    });

    it("Should emit CreatorRated event", async function () {
      await expect(
        registry.connect(user1).rateCreator(creator1.address, 4, "Good")
      ).to.emit(registry, "CreatorRated");
    });

    it("Should fail if score out of range", async function () {
      await expect(
        registry.connect(user1).rateCreator(creator1.address, 0, "Bad")
      ).to.be.revertedWith("Score must be 1-5");
      
      await expect(
        registry.connect(user1).rateCreator(creator1.address, 6, "Too good")
      ).to.be.revertedWith("Score must be 1-5");
    });

    it("Should fail if already rated", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "Great");
      
      await expect(
        registry.connect(user1).rateCreator(creator1.address, 4, "Good")
      ).to.be.revertedWith("Already rated");
    });

    it("Should fail if rating yourself", async function () {
      await expect(
        registry.connect(creator1).rateCreator(creator1.address, 5, "I'm great")
      ).to.be.revertedWith("Cannot rate yourself");
    });

    it("Should calculate average rating correctly", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "");
      await registry.connect(user2).rateCreator(creator1.address, 3, "");
      
      const avg = await registry.getAverageRating(creator1.address);
      expect(avg).to.equal(400); // (5+3)/2 = 4.00 * 100
    });

    it("Should store ratings", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "Excellent!");
      
      const ratings = await registry.getRatings(creator1.address, 0, 10);
      expect(ratings.length).to.equal(1);
      expect(ratings[0].score).to.equal(5);
      expect(ratings[0].comment).to.equal("Excellent!");
      expect(ratings[0].rater).to.equal(user1.address);
    });

    it("Should paginate ratings", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "1");
      await registry.connect(user2).rateCreator(creator1.address, 4, "2");
      
      const firstPage = await registry.getRatings(creator1.address, 0, 1);
      expect(firstPage.length).to.equal(1);
      expect(firstPage[0].comment).to.equal("1");
      
      const secondPage = await registry.getRatings(creator1.address, 1, 1);
      expect(secondPage.length).to.equal(1);
      expect(secondPage[0].comment).to.equal("2");
    });
  });

  describe("Flagging", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
    });

    it("Should flag creator successfully", async function () {
      await registry.connect(user1).flagCreator(creator1.address, "Scam");

      const stats = await registry.getStats(creator1.address);
      expect(stats.flags).to.equal(1);
    });

    it("Should emit CreatorFlagged event", async function () {
      await expect(
        registry.connect(user1).flagCreator(creator1.address, "Suspicious")
      ).to.emit(registry, "CreatorFlagged");
    });

    it("Should allow multiple flags", async function () {
      await registry.connect(user1).flagCreator(creator1.address, "Reason 1");
      await registry.connect(user2).flagCreator(creator1.address, "Reason 2");

      const stats = await registry.getStats(creator1.address);
      expect(stats.flags).to.equal(2);
    });

    it("Should fail if reason empty", async function () {
      await expect(
        registry.connect(user1).flagCreator(creator1.address, "")
      ).to.be.revertedWith("Reason required");
    });
  });

  describe("Stats Management", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
    });

    it("Should update stats", async function () {
      await registry.updateStats(creator1.address, ethers.parseEther("100"));

      const stats = await registry.getStats(creator1.address);
      expect(stats.tokensCreated).to.equal(1);
      expect(stats.totalVolume).to.equal(ethers.parseEther("100"));
    });

    it("Should increment tokens created", async function () {
      await registry.incrementTokensCreated(creator1.address);
      await registry.incrementTokensCreated(creator1.address);

      const stats = await registry.getStats(creator1.address);
      expect(stats.tokensCreated).to.equal(2);
    });

    it("Should only allow owner to update stats", async function () {
      await expect(
        registry.connect(user1).updateStats(creator1.address, 100)
      ).to.be.reverted;
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
    });

    it("Should verify creator", async function () {
      await registry.verifyCreator(creator1.address);

      const profile = await registry.getProfile(creator1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should emit CreatorVerified event", async function () {
      await expect(
        registry.verifyCreator(creator1.address)
      ).to.emit(registry, "CreatorVerified");
    });

    it("Should allow verifiers to verify", async function () {
      await registry.addVerifier(user1.address);
      await registry.connect(user1).verifyCreator(creator1.address);

      const profile = await registry.getProfile(creator1.address);
      expect(profile.isVerified).to.be.true;
    });

    it("Should fail if not a verifier", async function () {
      await expect(
        registry.connect(user1).verifyCreator(creator1.address)
      ).to.be.revertedWith("Not a verifier");
    });

    it("Should unverify creator", async function () {
      await registry.verifyCreator(creator1.address);
      await registry.unverifyCreator(creator1.address);

      const profile = await registry.getProfile(creator1.address);
      expect(profile.isVerified).to.be.false;
    });
  });

  describe("Banning", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "", "", "", "");
    });

    it("Should ban creator", async function () {
      await registry.banCreator(creator1.address, "Violated terms");

      const profile = await registry.getProfile(creator1.address);
      expect(profile.isBanned).to.be.true;
    });

    it("Should emit CreatorBanned event", async function () {
      await expect(
        registry.banCreator(creator1.address, "Scam")
      ).to.emit(registry, "CreatorBanned");
    });

    it("Should prevent banned creator from rating", async function () {
      await registry.connect(creator2).registerCreator("Creator 2", "", "", "", "");
      await registry.banCreator(creator1.address, "Bad");

      await expect(
        registry.connect(user1).rateCreator(creator1.address, 5, "")
      ).to.be.revertedWith("Creator banned");
    });

    it("Should unban creator", async function () {
      await registry.banCreator(creator1.address, "Test");
      await registry.unbanCreator(creator1.address);

      const profile = await registry.getProfile(creator1.address);
      expect(profile.isBanned).to.be.false;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await registry.connect(creator1).registerCreator("Creator 1", "Bio 1", "web1.com", "@c1", "@c1_tg");
      await registry.connect(creator2).registerCreator("Creator 2", "Bio 2", "web2.com", "@c2", "@c2_tg");
    });

    it("Should get profile correctly", async function () {
      const profile = await registry.getProfile(creator1.address);
      
      expect(profile.name).to.equal("Creator 1");
      expect(profile.bio).to.equal("Bio 1");
      expect(profile.website).to.equal("web1.com");
      expect(profile.twitter).to.equal("@c1");
      expect(profile.telegram).to.equal("@c1_tg");
    });

    it("Should get creators list", async function () {
      const creators = await registry.getCreators(0, 10, false);
      
      expect(creators.length).to.equal(2);
      expect(creators[0]).to.equal(creator1.address);
      expect(creators[1]).to.equal(creator2.address);
    });

    it("Should filter verified creators", async function () {
      await registry.verifyCreator(creator1.address);
      
      const verified = await registry.getCreators(0, 10, true);
      expect(verified.length).to.equal(1);
      expect(verified[0]).to.equal(creator1.address);
    });

    it("Should get top creators", async function () {
      await registry.updateStats(creator1.address, ethers.parseEther("100"));
      await registry.updateStats(creator2.address, ethers.parseEther("50"));
      
      const [topCreators, volumes] = await registry.getTopCreators(2);
      
      expect(topCreators.length).to.equal(2);
      expect(volumes[0]).to.equal(ethers.parseEther("100"));
    });

    it("Should get ratings count", async function () {
      await registry.connect(user1).rateCreator(creator1.address, 5, "");
      await registry.connect(user2).rateCreator(creator1.address, 4, "");
      
      const count = await registry.getRatingsCount(creator1.address);
      expect(count).to.equal(2);
    });
  });
});
