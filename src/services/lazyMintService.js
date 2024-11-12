import { ethers } from "ethers";

const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "redeemer",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minPrice",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "uri",
            "type": "string"
          }
        ],
        "internalType": "struct UmarPassportLazyMint.NFTVoucher",
        "name": "voucher",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "redeem",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
]

export class LazyMintService {
  constructor(contractAddress, signer) {
    this.contract = new ethers.Contract(contractAddress, ABI, signer);
  }

  async redeem(redeemer, voucher, signature) {
    const tx = await this.contract.redeem(redeemer, voucher, signature, {
      value: voucher.minPrice,
    });
    return await tx.wait();
  }
}
