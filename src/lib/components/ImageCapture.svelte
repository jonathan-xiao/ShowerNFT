<script lang="ts">
  import { onMount } from "svelte";
  import WebcamFeed from "./WebcamFeed.svelte";

  export let onImageCaptured: (imageDataUrl: string) => void;

  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let capturedImage: string | null = null;
  let isCapturing = false;

  function handleVideoReady(video: HTMLVideoElement) {
    videoElement = video;
  }

  function captureSnapshot() {
    if (!videoElement || !canvasElement) return;

    isCapturing = true;

    // Set canvas dimensions to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw video frame to canvas
    const ctx = canvasElement.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0);

      // Get image data URL (base64 encoded JPEG)
      const imageDataUrl = canvasElement.toDataURL("image/jpeg", 0.85);
      capturedImage = imageDataUrl;

      // Notify parent component
      onImageCaptured(imageDataUrl);
    }

    setTimeout(() => {
      isCapturing = false;
    }, 200);
  }

  function retakePhoto() {
    capturedImage = null;
  }
</script>

<div class="image-capture-container space-y-4">
  {#if !capturedImage}
    <!-- Live webcam feed -->
    <div class="relative">
      <WebcamFeed onVideoReady={handleVideoReady} />

      <!-- Capture overlay instructions -->
      <div
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-20"
      >
        📸 Smile! Post-shower selfie time
      </div>
    </div>

    <!-- Capture button -->
    <button
      on:click={captureSnapshot}
      disabled={isCapturing}
      class="w-full bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isCapturing ? "📸 Capturing..." : "📸 Capture Shower Selfie"}
    </button>
  {:else}
    <!-- Preview captured image -->
    <div class="relative bg-black rounded-lg overflow-hidden shadow-lg">
      <img
        src={capturedImage}
        alt="Captured shower selfie"
        class="w-full h-auto"
      />

      <div
        class="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-20"
      >
        ✅ CAPTURED
      </div>
    </div>

    <!-- Retake button -->
    <button
      on:click={retakePhoto}
      class="w-full bg-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-200"
    >
      🔄 Retake Photo
    </button>
  {/if}

  <!-- Hidden canvas for image capture -->
  <canvas bind:this={canvasElement} class="hidden"></canvas>
</div>

<style>
  .image-capture-container {
    max-width: 640px;
    margin: 0 auto;
  }
</style>
