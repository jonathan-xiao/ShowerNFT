<script lang="ts">
  import {
    showView,
    totalTime,
    showerThought,
    walletAddress,
    mintTxHash,
    mintedTokenId,
    latestNFTData,
    isLoadingNFTData,
    currentUser,
  } from "$lib/stores";
  import { formatAddress, CONTRACT_ADDRESS } from "$lib/web3";
  import { get } from "svelte/store";
  import { getLatestNFT } from "$lib/authService";
  import { onMount } from "svelte";

  // Load NFT data from Firebase on mount
  onMount(async () => {
    if ($currentUser) {
      console.log("🎨 Loading NFT data from Firebase for Complete screen...");
      isLoadingNFTData.set(true);
      const result = await getLatestNFT();
      
      if (result.success && result.latestNFT) {
        const nftRecord = result.latestNFT;
        latestNFTData.set({
          tokenId: nftRecord.tokenId,
          expiresAt: nftRecord.expiresAt,
          mintTime: nftRecord.mintTime,
          showerThought: nftRecord.showerThought,
          imageUrl: nftRecord.imageUrl,
          customTimeout: nftRecord.customTimeout || 0,
          isValid: true
        });
        console.log("✅ Loaded NFT from Firebase:", nftRecord);
      }
      isLoadingNFTData.set(false);
    }
  });

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }

  function viewOnBaseScan() {
    if ($mintTxHash) {
      window.open(`https://sepolia.basescan.org/tx/${$mintTxHash}`, "_blank");
    }
  }

  function viewContractOnBaseScan() {
    const contractAddr = get(CONTRACT_ADDRESS);
    window.open(
      `https://sepolia.basescan.org/address/${contractAddr}`,
      "_blank"
    );
  }
</script>

<div class="app-view space-y-6 text-center">
  <h2 class="text-3xl font-bold text-green-600">Minting Successful!</h2>
  <p class="text-gray-600">
    Your Certificate of Cleanliness is now secured on the blockchain. You may
    now present this to colleagues, friends, and family as definitive proof of
    hygiene.
  </p>

  <div
    class="bg-blue-50 border-4 border-dashed border-blue-200 p-6 rounded-lg shadow-inner"
  >
    <!-- Show actual NFT image if available, otherwise placeholder -->
    {#if $latestNFTData?.imageUrl}
      <img
        src={$latestNFTData.imageUrl}
        alt="Your Shower Selfie NFT"
        class="w-full rounded-lg shadow-md mb-4 object-cover"
        style="max-height: 400px;"
      />
    {:else}
      <div class="w-full h-64 bg-gray-200 rounded-lg shadow-md mb-4 flex items-center justify-center">
        <p class="text-gray-500">🖼️ Loading NFT image...</p>
      </div>
    {/if}

    <h3 class="text-xl font-bold text-left mb-2">NFT Metadata</h3>
    <div class="text-left space-y-1 text-sm">
      <p>
        <strong>Token ID:</strong>
        <span class="font-mono text-gray-700">#{String($mintedTokenId || $latestNFTData?.tokenId || "???").padStart(5, "0")}</span>
      </p>
      <p>
        <strong>Verification:</strong>
        <span class="font-mono text-green-700 font-bold">Proof-of-Lather ✨</span>
      </p>
      <p>
        <strong>Duration:</strong>
        <span class="font-mono text-gray-700">{formatTime($totalTime)}</span>
      </p>
      <p>
        <strong>Shower Thought:</strong>
        <span class="font-mono text-gray-700 italic"
          >{$showerThought || $latestNFTData?.showerThought || "N/A (No profound thoughts recorded)"}</span
        >
      </p>
      <p>
        <strong>Minted By:</strong>
        <span class="font-mono text-gray-700"
          >{formatAddress($walletAddress || "")}</span
        >
      </p>
      {#if $mintTxHash}
        <p>
          <strong>Transaction:</strong>
          <button
            on:click={viewOnBaseScan}
            class="font-mono text-blue-600 hover:underline text-xs"
          >
            View on BaseScan →
          </button>
        </p>
      {/if}
    </div>

    <!-- NFT Viewer Links -->
    <div class="mt-4 pt-4 border-t border-blue-300 space-y-2">
      <p class="text-xs font-semibold text-gray-600 mb-2">View Your NFT:</p>
      <div class="flex flex-col gap-2">
        <button
          on:click={viewContractOnBaseScan}
          class="bg-gray-700 text-white text-xs font-medium py-2 px-4 rounded hover:bg-gray-800 transition"
        >
          📜 View Contract on BaseScan
        </button>
      </div>
    </div>
  </div>
  <button
    on:click={() => showView("dashboard")}
    class="w-full bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
  >
    Back to Dashboard
  </button>
</div>
