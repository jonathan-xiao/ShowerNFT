<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { GestureType } from "$lib/ml/poseDetector";
  import { currentPoses } from "$lib/stores";

  export let gesture: GestureType;
  export let instruction: string;
  export let durationSeconds = 10;
  export let onComplete: () => void;

  let timeRemaining = durationSeconds;
  let isActive = false;
  let confidence = 0;
  let interval: any;
  let isTimerRunning = false;

  // Reset timer when gesture changes (new step)
  $: if (gesture) {
    console.log(`🔄 New gesture: ${gesture}, resetting timer`);
    timeRemaining = durationSeconds;
    isActive = false;
    confidence = 0;
    // Restart the timer for the new step
    stopTimer();
    startTimer();
  }

  // Analyze gesture from shared store poses
  function analyzeGesture(poses: any[]) {
    if (poses.length === 0) {
      isActive = false;
      confidence = 0;
      return;
    }

    const pose = poses[0];
    const keypoints = pose.keypoints;

    const leftWrist = keypoints.find((kp: any) => kp.name === "left_wrist");
    const rightWrist = keypoints.find((kp: any) => kp.name === "right_wrist");
    const nose = keypoints.find((kp: any) => kp.name === "nose");
    const leftShoulder = keypoints.find(
      (kp: any) => kp.name === "left_shoulder"
    );
    const rightShoulder = keypoints.find(
      (kp: any) => kp.name === "right_shoulder"
    );

    let detected = false;
    let conf = 0;

    switch (gesture) {
      case "rub-hands":
        if (leftWrist && rightWrist) {
          const distance = Math.sqrt(
            Math.pow(leftWrist.x - rightWrist.x, 2) +
              Math.pow(leftWrist.y - rightWrist.y, 2)
          );
          detected = distance < 100;
          conf = Math.min(leftWrist.score, rightWrist.score);
        }
        break;

      case "scrub-head":
        if (nose) {
          const leftDist = leftWrist
            ? Math.sqrt(
                Math.pow(leftWrist.x - nose.x, 2) +
                  Math.pow(leftWrist.y - nose.y, 2)
              )
            : Infinity;

          const rightDist = rightWrist
            ? Math.sqrt(
                Math.pow(rightWrist.x - nose.x, 2) +
                  Math.pow(rightWrist.y - nose.y, 2)
              )
            : Infinity;

          detected = leftDist < 150 || rightDist < 150;
          conf = Math.max(leftWrist?.score || 0, rightWrist?.score || 0);
        }
        break;

      case "scrub-arms":
        if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
          const leftToRightShoulder = Math.sqrt(
            Math.pow(leftWrist.x - rightShoulder.x, 2) +
              Math.pow(leftWrist.y - rightShoulder.y, 2)
          );

          const rightToLeftShoulder = Math.sqrt(
            Math.pow(rightWrist.x - leftShoulder.x, 2) +
              Math.pow(rightWrist.y - leftShoulder.y, 2)
          );

          detected = leftToRightShoulder < 120 || rightToLeftShoulder < 120;
          conf = Math.min(leftWrist.score, rightWrist.score);
        }
        break;

      case "scrub-armpits":
        if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
          const leftHandUp = leftWrist.y < leftShoulder.y;
          const rightHandUp = rightWrist.y < rightShoulder.y;
          detected = leftHandUp || rightHandUp;
          conf = Math.max(leftWrist.score, rightWrist.score);
        }
        break;
    }

    isActive = detected && conf > 0.3;
    confidence = conf;

    // Debug logging
    if (detected && conf > 0.3) {
      console.log(
        `✅ Gesture "${gesture}" detected! Confidence: ${(conf * 100).toFixed(0)}%`
      );
    }
  }

  // Watch for pose updates from store
  $: analyzeGesture($currentPoses);

  function startTimer() {
    if (isTimerRunning) return; // Prevent duplicate timers
    isTimerRunning = true;

    interval = setInterval(() => {
      if (isActive && timeRemaining > 0) {
        timeRemaining--;
        console.log(
          `⏱️ Timer tick: ${timeRemaining}s remaining (active: ${isActive})`
        );
        if (timeRemaining <= 0) {
          stopTimer();
          onComplete();
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    isTimerRunning = false;
  }

  onMount(() => {
    console.log(`🚀 ShowerStep mounted for gesture: ${gesture}`);
    startTimer();
  });

  onDestroy(() => {
    console.log(`🛑 ShowerStep destroyed for gesture: ${gesture}`);
    stopTimer();
  });

  $: statusClass = isActive ? "text-green-600" : "text-red-600";
  $: statusMessage = isActive
    ? `Great! Keep going... (${Math.round(confidence * 100)}% confidence)`
    : "Start the motion to continue timer!";
</script>

<div class="shower-step space-y-4">
  <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
    <p class="text-lg font-bold text-blue-900">{instruction}</p>
  </div>

  <div class="bg-gray-900 text-white p-6 rounded-lg shadow-inner">
    <div class="text-sm uppercase text-gray-400">Time Remaining</div>
    <div class="text-6xl font-extrabold tracking-tighter">{timeRemaining}s</div>
  </div>

  <div
    class="h-12 p-2 text-lg font-medium {statusClass} text-center"
    role="alert"
  >
    {statusMessage}
  </div>

  <div class="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
    <div
      class="bg-green-500 h-full rounded-full transition-all duration-300"
      style="width: {((durationSeconds - timeRemaining) / durationSeconds) *
        100}%;"
    ></div>
  </div>
</div>
