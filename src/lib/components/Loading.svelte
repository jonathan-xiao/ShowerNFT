<script lang="ts">
  // Loading screen waits for actual blockchain confirmation
  // No automatic redirect - the Minting component handles success/failure
</script>

<div class="app-view space-y-6 text-center">
  <h2 class="text-3xl font-bold text-blue-700">Minting in Progress...</h2>
  <p class="text-gray-600">
    Contacting the blockchain... Verifying your Proof-of-Lather... Polishing
    your NFT...
  </p>
  <p class="text-sm text-gray-500">
    Please confirm the transaction in MetaMask and wait for it to be mined on
    Base Sepolia.
  </p>
  <div class="flex justify-center items-center p-12">
    <div
      class="w-16 h-16 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"
    ></div>
  </div>
  <p class="text-xs text-gray-400">This may take 10-30 seconds...</p>
</div>
