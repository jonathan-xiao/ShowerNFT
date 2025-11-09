<script lang="ts">
  import { onMount } from "svelte";
  import {
    showView,
    showerThought,
    walletAddress,
    totalTime,
    currentUser,
    capturedImageData,
  } from "$lib/stores";
  import { mintShowerNFT, connectWallet } from "$lib/web3";
  import { recordNFTMint, saveWalletAddress, uploadShowerImage } from "$lib/authService";
  import ImageCapture from "./ImageCapture.svelte";

  let thought = "";
  let customTimeoutMinutes: number | null = null;
  let isMinting = false;
  let errorMessage = "";

  // Reset state on mount to ensure clean slate
  onMount(() => {
    isMinting = false;
    errorMessage = "";
    thought = "";
    customTimeoutMinutes = null;
  });

  // Validation
  const MAX_THOUGHT_LENGTH = 100;
  $: thoughtError =
    thought.length > MAX_THOUGHT_LENGTH
      ? `Shower thought too long (${thought.length}/${MAX_THOUGHT_LENGTH})`
      : "";
  $: isValid = !thoughtError && $capturedImageData && $walletAddress;

  async function handleConnectWallet() {
    await connectWallet();
    // Save wallet to Firebase when reconnecting
    if ($walletAddress) {
      await saveWalletAddress($walletAddress);
    }
  }

  function handleImageCaptured(imageData: string) {
    // Just store in local store - no upload yet!
    capturedImageData.set(imageData);
  }

  function setDefaultTimeout() {
    customTimeoutMinutes = null;
  }

  async function mintNFT() {
    if (!$walletAddress) {
      errorMessage = "Please connect your wallet first!";
      return;
    }

    if (!$capturedImageData) {
      errorMessage = "Please capture a shower selfie!";
      return;
    }

    if (thoughtError) {
      errorMessage = thoughtError;
      return;
    }

    if (!$currentUser) {
      errorMessage = "You must be logged in to mint";
      return;
    }

    showerThought.set(thought);
    isMinting = true;
    errorMessage = "";

    try {
      // Step 1: Upload image to Firebase Storage (client-side with auth)
      const uploadResult = await uploadShowerImage($capturedImageData, $currentUser.uid);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Failed to upload image");
      }

      const imageUrl = uploadResult.url;

      // Step 2: Calculate timeout in seconds (0 = default 24hr)
      const timeoutSeconds =
        customTimeoutMinutes !== null ? customTimeoutMinutes * 60 : 0;

      // Step 3: Show loading view
      showView("loading");

      // Step 4: Mint NFT with uploaded image URL
      const result = await mintShowerNFT(thought, imageUrl, timeoutSeconds);

      if (result.success && result.txHash) {
        // Step 5: Record NFT mint to Firebase
        await recordNFTMint({
          tokenId: result.tokenId || 0,
          txHash: result.txHash,
          showerThought: thought,
          imageUrl: imageUrl,
          duration: $totalTime,
          walletAddress: $walletAddress,
          customTimeout: timeoutSeconds,
        });

        // Clear captured image for next time
        capturedImageData.set(null);

        // Reset minting state
        isMinting = false;

        // Success! Show complete screen
        showView("complete");
      } else {
        // Show error and reset state
        errorMessage = result.error || "Failed to mint NFT";
        isMinting = false;
        // Don't navigate - stay on this page to show error
      }
    } catch (err) {
      console.error("Minting error:", err);
      errorMessage =
        err instanceof Error ? err.message : "Failed to mint NFT";
      isMinting = false;
      // Don't navigate - stay on this page to show error
    }
  }
</script>

<div class="app-view space-y-6 max-w-2xl mx-auto">
  <h2 class="text-3xl font-bold text-center">
    🎉 Verification Complete!
  </h2>
  <p class="text-gray-600 text-center">
    You are now eligible to mint your <span class="font-bold text-blue-600"
      >Proof-of-Lather NFT</span
    >. Capture your post-shower glow!
  </p>

  <!-- Wallet Status -->
  {#if !$walletAddress}
    <div
      class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg"
    >
      <p class="font-medium">⚠️ Wallet Not Connected</p>
      <p class="text-sm mb-2">Please connect your MetaMask wallet to mint.</p>
      <button
        on:click={handleConnectWallet}
        class="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
      >
        🦊 Connect MetaMask
      </button>
    </div>
  {/if}

  <!-- Image Capture -->
  <div class="space-y-2">
    <div class="block text-sm font-medium text-gray-700">
      📸 Shower Selfie (Required)
    </div>
    <ImageCapture onImageCaptured={handleImageCaptured} />
    {#if $capturedImageData}
      <p class="text-green-600 text-sm font-medium">
        ✅ Image captured! Will upload when you mint.
      </p>
    {/if}
  </div>

  <!-- Shower Thought Input -->
  <div>
    <label
      for="shower-thought"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      💭 Your Shower Thought (Optional, max {MAX_THOUGHT_LENGTH} chars)
    </label>
    <input
      type="text"
      id="shower-thought"
      bind:value={thought}
      maxlength={MAX_THOUGHT_LENGTH}
      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      class:border-red-500={thoughtError}
      placeholder="e.g., 'Why is it called a building if it's already built?'"
    />
    <div class="flex justify-between mt-1">
      {#if thoughtError}
        <p class="text-red-600 text-sm">{thoughtError}</p>
      {:else}
        <p class="text-gray-500 text-sm">
          {thought.length}/{MAX_THOUGHT_LENGTH}
        </p>
      {/if}
    </div>
  </div>

  <!-- Timeout Selector -->
  <div class="space-y-2">
    <div class="block text-sm font-medium text-gray-700">
      ⏱️ NFT Expiry Time
    </div>
    <div class="flex gap-2">
      <button
        on:click={setDefaultTimeout}
        class="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200"
        class:bg-blue-600={customTimeoutMinutes === null}
        class:text-white={customTimeoutMinutes === null}
        class:bg-gray-200={customTimeoutMinutes !== null}
        class:text-gray-700={customTimeoutMinutes !== null}
      >
        🕐 24 Hours (Default)
      </button>
      <input
        type="number"
        bind:value={customTimeoutMinutes}
        min="1"
        max="1440"
        placeholder="Minutes"
        class="w-32 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-center"
      />
    </div>
    <p class="text-gray-500 text-sm">
      {#if customTimeoutMinutes !== null && customTimeoutMinutes > 0}
        🎯 Demo mode: NFT expires in <span class="font-bold text-purple-600"
          >{customTimeoutMinutes} minute{customTimeoutMinutes !== 1 ? "s" : ""}</span
        >
      {:else}
        💎 Standard mode: NFT expires in 24 hours
      {/if}
    </p>
  </div>

  <!-- Error Message -->
  {#if errorMessage}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
    >
      <p class="font-medium">❌ Error</p>
      <p class="text-sm">{errorMessage}</p>
    </div>
  {/if}

  <!-- Mint Button -->
  <button
    on:click={mintNFT}
    disabled={isMinting || !isValid}
    class="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold text-lg py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if isMinting}
      ⏳ Uploading & Minting...
    {:else if !$capturedImageData}
      📸 Capture Image First
    {:else if !$walletAddress}
      🦊 Connect Wallet
    {:else}
      🚿 Mint My Proof-of-Lather NFT
    {/if}
  </button>
</div>
