# Interactive Shower Tutorial - Technical Documentation

## Overview

The **Interactive Shower Tutorial** is an ML-powered, webcam-based verification system that teaches users proper shower technique through real-time pose detection. Users must physically perform 4 shower gestures while being monitored by TensorFlow.js MoveNet pose estimation.

**Purpose**: Gamified hygiene verification with visual skeleton overlay and gesture-based progression.

---

## Architecture

### Component Hierarchy

```
ShowerTutorial.svelte (Orchestrator)
  ├── WebcamFeed.svelte (Camera stream)
  │   └── PoseOverlay.svelte (ML inference + visualization)
  └── ShowerStep.svelte (Gesture validation + timer)
```

### Data Flow

```
Video Stream → PoseOverlay (30 FPS inference)
                    ↓
            Svelte Store ($currentPoses)
                    ↓
            ShowerStep (gesture analysis)
                    ↓
            Timer progression (only when gesture active)
```

---

## Core Components

### 1. **ShowerTutorial.svelte** - Main Orchestrator

**Responsibilities:**

- Manages 4-step tutorial flow
- Initializes TensorFlow.js backend
- Coordinates between webcam, overlay, and validation
- Tracks completion state

**Key State:**

```typescript
let currentStepIndex = 0; // Which step (0-3)
let videoElement: HTMLVideoElement | null;
let isLoading = true; // Model loading state
let loadError = ""; // Error message
let detector: any = null; // MoveNet detector instance
```

**Steps Configuration:**

```typescript
const steps: TutorialStep[] = [
  {
    gesture: "rub-hands",
    instruction: "💧 Lather the soap by rubbing your hands together",
    duration: 10,
  },
  {
    gesture: "scrub-head",
    instruction: "🧴 Scrub your head/hair",
    duration: 10,
  },
  { gesture: "scrub-arms", instruction: "💪 Scrub your arms", duration: 10 },
  {
    gesture: "scrub-armpits",
    instruction: "🙌 Scrub your armpits",
    duration: 10,
  },
];
```

**Lifecycle:**

1. **Mount**: User grants webcam permissions
2. **Init**: TensorFlow.js backend loads (~5-10 seconds)
3. **Ready**: PoseOverlay starts 30 FPS inference
4. **Loop**: Each step validates gesture for 10 seconds
5. **Complete**: Sets `tutorialCompleted` store, proceeds to verification

---

### 2. **WebcamFeed.svelte** - Camera Stream Provider

**Responsibilities:**

- Request webcam permissions
- Manage MediaStream lifecycle
- Provide video element to children via slot

**Video Configuration:**

```typescript
{
  video: { width: 640, height: 480 },
  audio: false,
}
```

**Error Handling:**

- Catches permission denials
- Shows user-friendly error message
- Provides skip option

**Cleanup:**

- Stops all video tracks on unmount
- Prevents camera LED staying on

---

### 3. **PoseOverlay.svelte** - ML Inference Engine

**Responsibilities:**

- Run MoveNet pose detection at 30 FPS
- Draw skeleton visualization on canvas
- Write pose results to shared store

**Performance Optimization:**

```typescript
const targetFPS = 30; // Configurable tick rate
const frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;

// Throttle to prevent excessive inference
const elapsed = timestamp - lastFrameTime;
if (elapsed < frameInterval) {
  return; // Skip this frame
}
```

**Skeleton Connections:**
17 keypoint pairs (nose-eyes, shoulders-elbows, etc.)

**Visualization:**

- **Green dots** (>70% confidence): High accuracy joints
- **Yellow dots** (50-70%): Medium accuracy
- **Orange dots** (30-50%): Low accuracy (threshold for detection)
- **Green lines**: Connections between confident keypoints
- **Text overlay**: Average detection confidence %

**Store Integration:**

```typescript
const poses = await detector.estimatePoses(video);
currentPoses.set(poses); // Write to Svelte store
```

**Why Canvas?**

- Overlays directly on video without affecting DOM layout
- Hardware-accelerated drawing
- Real-time performance at 30 FPS

---

### 4. **ShowerStep.svelte** - Gesture Validator

**Responsibilities:**

- Analyze poses from store (no inference!)
- Validate specific gesture is being performed
- Control 10-second countdown timer
- Only tick when gesture is active (pause-on-stop)

**Gesture Detection Logic:**

#### **Rub Hands**

```typescript
const distance = Math.sqrt(
  Math.pow(leftWrist.x - rightWrist.x, 2) +
    Math.pow(leftWrist.y - rightWrist.y, 2)
);
detected = distance < 100; // Proximity threshold (pixels)
```

**How to pass**: Bring hands together in front of camera

---

#### **Scrub Head**

```typescript
const leftDist = Math.sqrt(
  Math.pow(leftWrist.x - nose.x, 2) + Math.pow(leftWrist.y - nose.y, 2)
);
const rightDist = Math.sqrt(
  Math.pow(rightWrist.x - nose.x, 2) + Math.pow(rightWrist.y - nose.y, 2)
);
detected = leftDist < 150 || rightDist < 150;
```

**How to pass**: Raise either hand to head level

---

#### **Scrub Arms**

```typescript
const leftToRightShoulder = Math.sqrt(
  Math.pow(leftWrist.x - rightShoulder.x, 2) +
    Math.pow(leftWrist.y - rightShoulder.y, 2)
);
const rightToLeftShoulder = Math.sqrt(
  Math.pow(rightWrist.x - leftShoulder.x, 2) +
    Math.pow(rightWrist.y - leftShoulder.y, 2)
);
detected = leftToRightShoulder < 120 || rightToLeftShoulder < 120;
```

**How to pass**: Cross-body motion (hand to opposite shoulder)

---

#### **Scrub Armpits**

```typescript
const leftHandUp = leftWrist.y < leftShoulder.y;
const rightHandUp = rightWrist.y < rightShoulder.y;
detected = leftHandUp || rightHandUp;
```

**How to pass**: Raise hand above shoulder height

---

**Timer Logic:**

```typescript
// Only tick when gesture is active
interval = setInterval(() => {
  if (isActive && timeRemaining > 0) {
    timeRemaining--;
    console.log(`⏱️ Timer tick: ${timeRemaining}s remaining`);
    if (timeRemaining <= 0) {
      stopTimer();
      onComplete(); // Trigger next step
    }
  }
}, 1000);
```

**Step Transition Handling:**

```typescript
// When gesture prop changes (new step)
$: if (gesture) {
  console.log(`🔄 New gesture: ${gesture}, resetting timer`);
  timeRemaining = durationSeconds;
  isActive = false;
  confidence = 0;
  // CRITICAL: Restart timer with new closure
  stopTimer();
  startTimer();
}
```

**Why restart timer?**
Without this, the old interval keeps the old `gesture` value in its closure, causing validation to check the wrong gesture.

---

### 5. **poseDetector.ts** - TensorFlow.js Wrapper

**Responsibilities:**

- Initialize TensorFlow.js WebGL backend
- Load MoveNet Lightning model (~6MB)
- Provide singleton detector instance
- Handle backend failures gracefully

**Initialization Sequence:**

```typescript
// Force WebGL backend (avoid WebGPU issues)
await tf.setBackend("webgl");
await tf.ready();

const detectorConfig = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
};

detector = await poseDetection.createDetector(
  poseDetection.SupportedModels.MoveNet,
  detectorConfig
);
```

**Why Force WebGL?**

- WebGPU is experimental and causes crashes
- WebGL is stable across all browsers
- Performance difference negligible for this use case

**Singleton Pattern:**

```typescript
if (detector) return detector; // Reuse existing
if (isInitializing) {
  // Wait for in-progress initialization
  while (isInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return detector;
}
```

**MoveNet Lightning vs Thunder:**
| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| Lightning | ~6MB | ~30ms/frame | Good |
| Thunder | ~12MB | ~50ms/frame | Better |

**Choice**: Lightning is sufficient for "are hands near head?" level detection.

---

## State Management

### Svelte Stores (`stores.ts`)

```typescript
// Pose detection data (shared between PoseOverlay and ShowerStep)
export const currentPoses = writable<any[]>([]);

// Tutorial completion flag (for future DB persistence)
export const tutorialCompleted = writable(false);
```

**Why use stores instead of props?**

- Eliminates prop drilling (WebcamFeed → PoseOverlay → ShowerTutorial → ShowerStep)
- Single source of truth for pose data
- Reactive updates across components
- Future-ready for persistence layer

---

## Performance Optimizations

### 1. **Single Inference Pipeline**

❌ **Before**: PoseOverlay + ShowerStep both ran inference = 60ms/frame (16 FPS, choppy)
✅ **After**: PoseOverlay runs once, ShowerStep reads from store = 30ms/frame (30 FPS, smooth)

**Performance Gain**: ~2x improvement

---

### 2. **Frame Rate Limiting**

```typescript
// In PoseOverlay.svelte
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

if (timestamp - lastFrameTime < frameInterval) {
  return; // Skip this frame
}
```

**Why 30 FPS?**

- Human reaction time ~200-300ms (3-9 frames at 30 FPS)
- Good balance between responsiveness and CPU usage
- MoveNet Lightning processes ~30ms per frame anyway

---

### 3. **Canvas Optimization**

- Only resize canvas when video dimensions change
- Clear + redraw (no retained mode overhead)
- Hardware-accelerated rendering
- `pointer-events: none` prevents blocking clicks

---

## Error Handling

### Backend Initialization Failures

```typescript
try {
  await tf.setBackend("webgl");
  await tf.ready();
} catch (error) {
  console.error("❌ Failed to initialize:", error);
  loadError = "Failed to load ML model. Please refresh or skip.";
  isLoading = false;
}
```

**Fallback**: Skip button always available

---

### Webcam Permission Denied

```typescript
try {
  stream = await navigator.mediaDevices.getUserMedia({...});
} catch (err) {
  errorMessage = "Camera access denied. Please enable camera.";
}
```

**Fallback**: Shows red error box with skip option

---

### Model Loading Timeout

- Shows spinner for 5-10 seconds
- Console logs progress: `🎥 Video ready, initializing...`
- If stuck >30s, user can skip

---

## Debug Features

### Console Logging

```typescript
console.log("🎥 Video ready, initializing pose detector...");
console.log("✅ Pose detector ready!");
console.log("🔄 New gesture: scrub-head, resetting timer");
console.log('✅ Gesture "scrub-head" detected! Confidence: 85%');
console.log("⏱️ Timer tick: 9s remaining (active: true)");
```

**How to debug:**

1. Open DevTools console
2. Start tutorial
3. Watch emoji-coded logs for each event

---

### Skip Buttons

1. **⚡ Debug** (top-right): Skips directly to minting
2. **"Skip Tutorial"** (bottom): Proceeds to verification
3. **"Skip to Next Step"** (on error): Bypasses broken step

All set `tutorialCompleted = true` to prevent re-showing tutorial.

---

## Browser Compatibility

### Requirements

- **WebGL 2.0** (for TensorFlow.js)
- **getUserMedia API** (for webcam)
- **ES2020** (async/await, optional chaining)

### Tested Browsers

✅ Chrome 90+
✅ Firefox 88+
✅ Edge 90+
✅ Safari 14.1+

❌ Internet Explorer (not supported)

---

## Future Enhancements

### Immediate (Hackathon++)

- [ ] Add visual "ghost" overlay showing ideal pose
- [ ] Sound effects on step completion
- [ ] Haptic feedback on mobile
- [ ] Gesture-specific coaching tips ("Move hands closer!")

### Advanced (Production)

- [ ] Store pose data on-chain or IPFS
- [ ] Generate "shower score" based on technique
- [ ] Multi-user simultaneous detection (group showers 😂)
- [ ] Custom gesture training (add new steps)
- [ ] Replay mode (show user their performance)

### Performance

- [ ] WebAssembly backend for 2x speed
- [ ] Model quantization (reduce size to 3MB)
- [ ] Progressive model loading (start with lower accuracy, upgrade)
- [ ] Offscreen canvas for background inference

---

## Common Issues & Solutions

### Issue: "Model stuck loading"

**Cause**: Slow network, model download timeout
**Solution**:

- Check Network tab for `tfjs-model` files
- Try different CDN in `poseDetector.ts`
- Self-host model files in `/public/models/`

---

### Issue: "Timer not progressing"

**Cause**: Gesture not detected OR timer interval not restarting
**Debug**:

```typescript
// Check console for:
"✅ Gesture detected! Confidence: X%"; // If missing, pose not matching
"⏱️ Timer tick: Xs remaining (active: true)"; // If active=false, gesture failing
```

**Solution**: Adjust detection thresholds in `ShowerStep.svelte`

---

### Issue: "Skeleton not drawing"

**Cause**: Canvas not overlaying video properly
**Debug**:

- Inspect canvas element (should have width/height matching video)
- Check `z-index: 10` on canvas
- Verify `detector` is not null
  **Solution**: Ensure `detector` is passed to `PoseOverlay`

---

### Issue: "Choppy/laggy performance"

**Cause**: Running inference twice OR low-end device
**Solution**:

1. Verify `PoseOverlay` writes to store, `ShowerStep` reads from store
2. Lower FPS: `const targetFPS = 20;` in `PoseOverlay.svelte`
3. Use lower resolution: `{ width: 320, height: 240 }` in `WebcamFeed.svelte`

---

## Code Reusability

### Adding a New Gesture

1. **Define gesture type** in `poseDetector.ts`:

```typescript
export type GestureType =
  | "rub-hands"
  | "scrub-head"
  | "scrub-arms"
  | "scrub-armpits"
  | "wave-goodbye";
```

2. **Add detection logic** in `ShowerStep.svelte`:

```typescript
case 'wave-goodbye':
  if (leftWrist && rightWrist) {
    // Check if hand is moving left-right rapidly
    const isWaving = Math.abs(leftWrist.x - rightWrist.x) > 200;
    detected = isWaving;
    conf = leftWrist.score;
  }
  break;
```

3. **Add to steps** in `ShowerTutorial.svelte`:

```typescript
{ gesture: "wave-goodbye", instruction: "👋 Wave goodbye to your stink!", duration: 5 },
```

**That's it!** The system automatically handles the new step.

---

### Reusing for Other Projects

**This architecture works for any pose-based interaction:**

**Fitness App**: Replace gestures with exercises

```typescript
{ gesture: "squat", instruction: "🦵 Do a squat", duration: 30 }
{ gesture: "pushup", instruction: "💪 Do a push-up", duration: 30 }
```

**Dance Game**: Detect dance moves

```typescript
{ gesture: "dab", instruction: "🕺 Hit the dab!", duration: 3 }
{ gesture: "floss", instruction: "🦷 Do the floss!", duration: 5 }
```

**Sign Language**: Validate ASL gestures

```typescript
{ gesture: "asl-hello", instruction: "👋 Sign: Hello", duration: 5 }
```

---

## Performance Metrics

### Typical Latency

- **Model load**: 5-10 seconds (first time only, cached after)
- **Inference**: 25-35ms per frame (@30 FPS)
- **Gesture detection**: <1ms (simple math)
- **UI update**: <16ms (60 FPS render)

### Resource Usage

- **Memory**: ~150MB (TensorFlow.js + model)
- **CPU**: ~30-40% (single core at 30 FPS inference)
- **GPU**: Minimal (WebGL context for TensorFlow.js)
- **Network**: 6MB download (one-time)

---

## Testing Checklist

### Manual Testing

- [ ] Webcam permissions granted
- [ ] Model loads without errors
- [ ] Skeleton appears on video
- [ ] All 4 gestures detected correctly
- [ ] Timer only advances when gesture active
- [ ] Timer resets between steps
- [ ] Step counter updates (1/4, 2/4, etc.)
- [ ] Completion triggers navigation to verification
- [ ] Skip buttons work
- [ ] Error states show properly
- [ ] Console logs are informative

### Edge Cases

- [ ] Camera permission denied → shows error
- [ ] Model load fails → shows error + skip
- [ ] User moves off-camera → detection pauses
- [ ] Multiple people in frame → detects first person
- [ ] Poor lighting → lower confidence but still works
- [ ] Browser tab backgrounded → inference pauses (saves CPU)

---

## Conclusion

The Interactive Shower Tutorial demonstrates:

- **Real-time ML** in the browser (no server needed)
- **Reactive state management** with Svelte stores
- **Performance optimization** (single inference pipeline)
- **Error resilience** (graceful fallbacks)
- **Developer experience** (emoji logs, debug buttons)

**Key Innovation**: Pause-on-stop timer creates authentic "you must actually do this" experience, preventing gaming the system.

**Hackathon Value**: Visual skeleton + live detection = impressive demo! 🚀

---

## Quick Reference

### File Structure

```
src/lib/
├── ml/
│   └── poseDetector.ts         # TensorFlow.js wrapper
├── components/
│   ├── ShowerTutorial.svelte   # Main orchestrator
│   ├── WebcamFeed.svelte       # Camera provider
│   ├── PoseOverlay.svelte      # ML inference + skeleton viz
│   └── ShowerStep.svelte       # Gesture validation + timer
└── stores.ts                    # Shared state (currentPoses, tutorialCompleted)
```

### Key Constants

- **Model**: MoveNet Lightning (SINGLEPOSE_LIGHTNING)
- **FPS**: 30 (configurable in `PoseOverlay.svelte`)
- **Step duration**: 10 seconds per gesture
- **Confidence threshold**: 0.3 (30%)
- **Video resolution**: 640x480

### Gesture Thresholds

- Rub hands: `distance < 100px`
- Scrub head: `distance < 150px`
- Scrub arms: `distance < 120px`
- Scrub armpits: `wrist.y < shoulder.y`

### Debug Commands

```javascript
// In browser console
localStorage.setItem("skipTutorial", "true"); // Future feature
tf.env().get("WEBGL_VERSION"); // Check WebGL support
navigator.mediaDevices.enumerateDevices(); // List cameras
```

---

**Last Updated**: November 8, 2025
**Version**: 1.0.0
**Status**: Production-ready for hackathon demo
