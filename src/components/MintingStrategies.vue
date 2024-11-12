<template>
  <v-table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Pre-defined V1: Standard Way</th>
        <th>Pre-defined V2: Lazy Minting</th>
        <th>Customized: Lazy Minting</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Door</td>
        <td>
          <v-btn
            href="https://testnets.opensea.io/assets/sepolia/0xb27fe598c87fb6e7e1ca440b2e08f001389a768d/0"
            target="_blank"
            variant="outlined"
            color="primary"
            size="small"
          >
            Buy NFT via OpenSea
          </v-btn>
          <p>ToDo: Buy NFT via COMPAS WebViewer</p>
        </td>
        <td>
          <v-btn
            v-if="isConnected"
            @click="lazyMintNFT"
            variant="elevated"
            class="mx-1"
            :loading="isLoading"
          >
            Lazy Mint & Buy NFT via COMPAS WebViewer
          </v-btn>
          <p v-else>Connect wallet to mint NFT</p>
        </td>
        <td></td>
      </tr>
      <tr>
        <td>Door Frame</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>Window</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>Wall</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </v-table>
</template>

<script>
import { useWallet } from "@/composables/useWallet";
const { isConnected, account, signer } = useWallet();

import { LazyMintService } from "@/services/lazyMintService";
import { ref, watch } from "vue";
import { ethers } from "ethers";

export default {
  name: "MintingStrategies",

  setup() {
    const isLoading = ref(false);
    const contractAddress = "0xB27fE598C87FB6E7E1ca440B2E08f001389A768D";
    let lazyMintService;

    watch(
      () => signer.value,
      (newSigner) => {
        console.log("MintingStrategies watch: newSigner", newSigner);
        lazyMintService = new LazyMintService(contractAddress, newSigner);
        console.log("lazyMintService", lazyMintService)

      }
    );

    watch(
      () => isConnected.value,
      (newIsConnected) => {
        console.log("newIsConnected ", newIsConnected);
      }
    );

    async function lazyMintNFT() {
      try {
        console.log("lazyMintService", lazyMintService)

        isLoading.value = true;

        const redeemer = account.value;

        const dummyDoorDataURI =
          "ipfs://Qmdbb89D4KbjxKebHLpyQP1EvMKgE2JK2xXM267Vhjy6Tx";

        const voucher = {
          tokenId: 99,
          minPrice: ethers.utils.parseEther("0.01"), // Convert minprice to wei
          uri: dummyDoorDataURI,
        };

        const domain = {
          name: "UmarPassportLazyMint",
          version: "1.0.0",
          chainId: 31337,
          verifyingContract: contractAddress,
        };

        const types = {
          NFTVoucher: [
            { name: "tokenId", type: "uint256" },
            { name: "minPrice", type: "uint256" },
            { name: "uri", type: "string" },
          ],
        };
        const ownerPrivateKey = "";
        const owner = new ethers.Wallet(ownerPrivateKey);
        const signature = await owner._signTypedData(domain, types, voucher);

        console.log("lazyMintService", lazyMintService)

        const tx = await lazyMintService.redeem(redeemer, voucher, signature);
        console.log("Minting successful:", tx.hash);
      } catch (error) {
        console.error("Minting failed:", error);
      } finally {
        isLoading.value = false;
      }
    }

    return {
      isConnected,
      isLoading,
      lazyMintNFT,
    };
  },
};
</script>
