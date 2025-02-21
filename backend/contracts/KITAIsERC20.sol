// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract KITAIsERC20 is ERC20 , Ownable {
   bytes32 public merkleRoot;
   uint256 private constant MINT_AMOUNT = 2 ether;

   mapping(address => bool) private hasMinted;

   constructor(address _initialOwner, bytes32 _merkleRoot) ERC20("KITA", "KITA") Ownable(_initialOwner) {
      merkleRoot = _merkleRoot;      
   }

   /**
   * @notice Change the merkle root
   * 
   * @param _merkleRoot The new merkle root
   *
   */
   function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
      merkleRoot = _merkleRoot;
   }

   /**
   * @notice Check if an address is whitelisted or not
   * 
   * @param _account The account checked
   * @param _proof The merkle proof
   *
   * @return bool return true if the account is whitelisted, false otherwise
   */
   function isWhitelisted(address _account, bytes32[] calldata _proof) public view returns (bool) {
      bytes32 leaf = keccak256(abi.encode(keccak256(abi.encode(_account))));
      return MerkleProof.verify(_proof, merkleRoot, leaf);
   }

   /**
   * @notice Allows a whitelisted user to mint tokens
   * 
   * @param _to The address to mint tokens to
   * @param _proof The merkle proof
   *
   */
   function mint(address _to, bytes32[] calldata _proof) external {
      require(isWhitelisted(_to, _proof), "NOT WHITELISTED");
      require(!hasMinted[msg.sender], "ALREADY MINTED");      
      hasMinted[msg.sender] = true;
      _mint(_to, MINT_AMOUNT);
   }

}

