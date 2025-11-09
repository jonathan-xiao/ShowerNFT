<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let onVideoReady: (video: HTMLVideoElement) => void = () => {};

  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let errorMessage = "";

  async function startWebcam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
        onVideoReady(videoElement);
      }
    } catch (err) {
      console.error("Webcam access error:", err);
      errorMessage = "Camera access denied. Please enable camera to continue.";
    }
  }

  function stopWebcam() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  onMount(() => {
    startWebcam();
  });

  onDestroy(() => {
    stopWebcam();
  });
</script>

<div
  class="webcam-container relative bg-black rounded-lg overflow-hidden shadow-lg"
>
  {#if errorMessage}
    <div
      class="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 z-20"
    >
      <p class="font-medium">{errorMessage}</p>
    </div>
  {:else}
    <video
      bind:this={videoElement}
      class="w-full h-auto"
      autoplay
      playsinline
      muted
    ></video>

    <!-- Slot for overlay (skeleton visualization) -->
    <slot />

    <div
      class="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-20"
    >
      🔴 LIVE
    </div>
  {/if}
</div>
