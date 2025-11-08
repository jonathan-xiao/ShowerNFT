import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export type GestureType = 'rub-hands' | 'scrub-head' | 'scrub-arms' | 'scrub-armpits';

export interface PoseAnalysis {
    isActive: boolean; // Are hands moving in correct position?
    confidence: number;
    gesture: GestureType | null;
}

let detector: poseDetection.PoseDetector | null = null;
let isInitializing = false;

export async function initPoseDetector() {
    if (detector) return detector;
    
    // Prevent duplicate initialization
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return detector;
    }
    
    isInitializing = true;
    
    try {
        console.log('🔧 Initializing TensorFlow.js backend...');
        
        // Force WebGL backend (avoid WebGPU issues)
        await tf.setBackend('webgl');
        await tf.ready();
        
        console.log('✅ TensorFlow.js backend ready:', tf.getBackend());
        console.log('📥 Loading MoveNet model...');
        
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );
        
        console.log('✅ MoveNet model loaded successfully!');
        return detector;
    } catch (error) {
        console.error('❌ Failed to initialize pose detector:', error);
        throw error;
    } finally {
        isInitializing = false;
    }
}

export async function analyzePose(
    video: HTMLVideoElement,
    targetGesture: GestureType
): Promise<PoseAnalysis> {
    if (!detector) {
        await initPoseDetector();
    }
    
    const poses = await detector!.estimatePoses(video);
    
    if (poses.length === 0) {
        return { isActive: false, confidence: 0, gesture: null };
    }
    
    const pose = poses[0];
    const keypoints = pose.keypoints;
    
    // Get key body parts
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
    const nose = keypoints.find(kp => kp.name === 'nose');
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
    
    // Detect motion based on target gesture
    switch (targetGesture) {
        case 'rub-hands':
            return detectHandRubbing(leftWrist, rightWrist);
        case 'scrub-head':
            return detectHeadScrubbing(leftWrist, rightWrist, nose);
        case 'scrub-arms':
            return detectArmScrubbing(leftWrist, rightWrist, leftShoulder, rightShoulder);
        case 'scrub-armpits':
            return detectArmpitScrubbing(leftWrist, rightWrist, leftShoulder, rightShoulder);
        default:
            return { isActive: false, confidence: 0, gesture: null };
    }
}

// Helper detection functions
function detectHandRubbing(
    leftWrist: any,
    rightWrist: any
): PoseAnalysis {
    if (!leftWrist || !rightWrist) {
        return { isActive: false, confidence: 0, gesture: null };
    }
    
    // Check if hands are close together (rubbing)
    const distance = Math.sqrt(
        Math.pow(leftWrist.x - rightWrist.x, 2) +
        Math.pow(leftWrist.y - rightWrist.y, 2)
    );
    
    const isRubbing = distance < 100; // Proximity threshold
    const confidence = Math.min(leftWrist.score, rightWrist.score);
    
    return {
        isActive: isRubbing && confidence > 0.3,
        confidence,
        gesture: isRubbing ? 'rub-hands' : null
    };
}

function detectHeadScrubbing(
    leftWrist: any,
    rightWrist: any,
    nose: any
): PoseAnalysis {
    if (!nose) {
        return { isActive: false, confidence: 0, gesture: null };
    }
    
    // Check if either hand is near head
    const leftDist = leftWrist ? Math.sqrt(
        Math.pow(leftWrist.x - nose.x, 2) +
        Math.pow(leftWrist.y - nose.y, 2)
    ) : Infinity;
    
    const rightDist = rightWrist ? Math.sqrt(
        Math.pow(rightWrist.x - nose.x, 2) +
        Math.pow(rightWrist.y - nose.y, 2)
    ) : Infinity;
    
    const isScrubbing = leftDist < 150 || rightDist < 150;
    const confidence = Math.max(leftWrist?.score || 0, rightWrist?.score || 0);
    
    return {
        isActive: isScrubbing && confidence > 0.3,
        confidence,
        gesture: isScrubbing ? 'scrub-head' : null
    };
}

function detectArmScrubbing(
    leftWrist: any,
    rightWrist: any,
    leftShoulder: any,
    rightShoulder: any
): PoseAnalysis {
    // Check if hand is near opposite shoulder (scrubbing arms)
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
        return { isActive: false, confidence: 0, gesture: null };
    }
    
    const leftToRightShoulder = Math.sqrt(
        Math.pow(leftWrist.x - rightShoulder.x, 2) +
        Math.pow(leftWrist.y - rightShoulder.y, 2)
    );
    
    const rightToLeftShoulder = Math.sqrt(
        Math.pow(rightWrist.x - leftShoulder.x, 2) +
        Math.pow(rightWrist.y - leftShoulder.y, 2)
    );
    
    const isScrubbing = leftToRightShoulder < 120 || rightToLeftShoulder < 120;
    const confidence = Math.min(leftWrist.score, rightWrist.score);
    
    return {
        isActive: isScrubbing && confidence > 0.3,
        confidence,
        gesture: isScrubbing ? 'scrub-arms' : null
    };
}

function detectArmpitScrubbing(
    leftWrist: any,
    rightWrist: any,
    leftShoulder: any,
    rightShoulder: any
): PoseAnalysis {
    // Similar to arm scrubbing but hands should be higher (near armpits)
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
        return { isActive: false, confidence: 0, gesture: null };
    }
    
    // Check if hand is raised and near shoulder height
    const leftHandUp = leftWrist.y < leftShoulder.y;
    const rightHandUp = rightWrist.y < rightShoulder.y;
    
    const isScrubbing = leftHandUp || rightHandUp;
    const confidence = Math.max(leftWrist.score, rightWrist.score);
    
    return {
        isActive: isScrubbing && confidence > 0.3,
        confidence,
        gesture: isScrubbing ? 'scrub-armpits' : null
    };
}

export function cleanupDetector() {
    if (detector) {
        detector.dispose();
        detector = null;
    }
}

export function getDetector() {
    return detector;
}
