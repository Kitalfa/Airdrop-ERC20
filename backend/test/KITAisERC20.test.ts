import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect, assert } from 'chai';
import { ethers } from 'hardhat';

// Types
import { KITAIsERC20 } from '../typechain-types';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

// Whitelisted addresses
import { whitelisted } from '../utils/whitelisted';
import exp from 'constants';

describe('KITAIsERC20', function () {
  let contract: KITAIsERC20;

  let owner: SignerWithAddress; // whitelisted
  let addr1: SignerWithAddress; // whitelisted
  let addr2: SignerWithAddress; // Not whitelisted

  let merkleTree: StandardMerkleTree<string[]>; // Merkle tree for airdrop

  async function deployContractFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    // Build merkle tree
    merkleTree = StandardMerkleTree.of(whitelisted, ['address'], {
      sortLeaves: true,
    });

    const KITAisERC20 = await ethers.getContractFactory('KITAIsERC20');
    const contract = await KITAisERC20.deploy(owner.address, merkleTree.root);

    return { contract, merkleTree, owner, addr1, addr2 };
  }

  // Deployment
  describe('Deployment', function () {
    it('Should deploy the contract', async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      let contractMerkleTreeRoot = await contract.merkleRoot();
      assert.equal(contractMerkleTreeRoot, merkleTree.root);
      let contractOwner = await contract.owner();
      assert.equal(contractOwner, owner.address);
    });
  });

  // Mint
  describe('Mint', function () {
    it('Should not mint tokens if not whitelisted | @openzeppelin/merkle-tree library Test', async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      try {
        const proof = merkleTree.getProof([addr2.address]);
        expect.fail(
          "Expected an error 'Error: Leaf is not in tree' but none was thrown."
        );
      } catch (error) {
        const err = error as Error;
        expect(err.message).to.include('Leaf is not in tree');
      }
    });

    it('Should not mint tokens if not whitelisted | contract Test', async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      const proof: string[] = [];
      await expect(
        contract.connect(addr2).mint(addr2.address, proof)
      ).to.be.revertedWith('NOT WHITELISTED');
    });
  });

  it('Should not mint tokens if tokens already minted', async function () {
    const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
      deployContractFixture
    );
    const proof = merkleTree.getProof([addr1.address]);
    await contract.connect(addr1).mint(addr1.address, proof);
    await expect(
      contract.connect(addr1).mint(addr1.address, proof)
    ).to.be.revertedWith('ALREADY MINTED');
  });

  it('Should mint tokens if whitelisted', async function () {
    const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
      deployContractFixture
    );
    const proof = merkleTree.getProof([addr1.address]);
    await contract.connect(addr1).mint(addr1.address, proof);
    let balance = await contract.balanceOf(addr1.address);
    let expectedBalance = ethers.parseEther('2');
    assert.equal(balance, expectedBalance);
  });

  // Set Merkle Root
  describe('Set Merkle Root', function () {
    it('Should not set merkle root if not owner', async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      await expect(contract.connect(addr1).setMerkleRoot(merkleTree.root))
        .to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
        .withArgs(addr1.address);
    });

    it('Should set merkle root if owner', async function () {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(
        deployContractFixture
      );
      await contract.connect(owner).setMerkleRoot(merkleTree.root);
      let contractMerkleTreeRoot = await contract.merkleRoot();
      assert.equal(contractMerkleTreeRoot, merkleTree.root);
    });
  });
});
