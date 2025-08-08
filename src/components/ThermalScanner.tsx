import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import ResultScreen from "./ResultScreen";
import ScanningLine from "./ScanningLine";

const getThermalColor = (intensity: number): [number, number, number] => {
  const normalized = Math.max(0, Math.min(1, intensity / 255));
  if (normalized < 0.3) {
    const t = normalized / 0.3;
    return [0, Math.floor(t * 255), 255];
  } else if (normalized < 0.35) {
    const t = (normalized - 0.3) / 0.05;
    return [0, 255, Math.floor(255 * (1 - t))];
  } else if (normalized < 0.5) {
    const t = (normalized - 0.35) / 0.15;
    return [Math.floor(t * 255), 255, 0];
  } else if (normalized < 0.75) {
    const t = (normalized - 0.5) / 0.25;
    return [255, Math.floor(255 * (1 - t)), 0];
  } else {
    const t = (normalized - 0.75) / 0.25;
    return [255, Math.floor(t * 165), 0];
  }
};

const ASPECT_RATIO = 9 / 16;
const WIDTH = 720;
const HEIGHT = Math.round(WIDTH / ASPECT_RATIO);

const ThermalScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<'idle' | 'countdown' | 'scanning' | 'result'>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [isCool, setIsCool] = useState<boolean>(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [isScanningLineDone, setIsScanningLineDone] = useState<boolean>(false);
  const animationFrameId = useRef<number | undefined>(undefined);
  const animationStartTime = useRef<number | null>(null);

  useEffect(() => {
  if (phase !== 'result') return;

  const restartTimeout = setTimeout(() => {
    setResult(null);
    setIsCool(false);
    setIsScanningLineDone(false);
    setCountdown(3);
    setPhase('idle');

    // Restart the camera
    const restartCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: WIDTH },
            height: { ideal: HEIGHT },
            facingMode: "user",
            aspectRatio: ASPECT_RATIO,
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => console.error("Error playing video:", err));
            setIsCameraReady(true);
            console.log("Camera restarted successfully");
          };
        }
      } catch (error) {
        console.error("Error restarting camera:", error);
      }
    };

    restartCamera();
  }, 5000); // Restart after 5 seconds

  return () => clearTimeout(restartTimeout);
}, [phase]);


  useEffect(() => {
    const createFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `./face_landmarker.task`, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.3,
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });
        setFaceLandmarker(landmarker);
        console.log("FaceLandmarker initialized successfully");
      } catch (error) {
        console.error("Error initializing face landmarker:", error);
        alert("Failed to initialize face detection. Please ensure the model file is accessible.");
      }
    };
    createFaceLandmarker();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: WIDTH },
            height: { ideal: HEIGHT },
            facingMode: "user",
            aspectRatio: ASPECT_RATIO,
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => console.error("Error playing video:", err));
            setIsCameraReady(true);
            console.log("Camera started successfully");
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Could not access the camera. Please check permissions.");
      }
    };
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    console.log("Camera stopped");
  };

  useEffect(() => {
    let lastVideoTime = -1;
    const processVideo = () => {
      if (!isCameraReady || !videoRef.current || !faceLandmarker || !canvasRef.current) {
        console.log("Not ready for detection:", {
          isCameraReady,
          video: !!videoRef.current,
          faceLandmarker: !!faceLandmarker,
          canvas: !!canvasRef.current,
        });
        animationFrameId.current = requestAnimationFrame(processVideo);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("Canvas context not available");
        animationFrameId.current = requestAnimationFrame(processVideo);
        return;
      }
      const videoTime = video.currentTime;
      if (video.paused || video.ended || videoTime === lastVideoTime) {
        animationFrameId.current = requestAnimationFrame(processVideo);
        return;
      }
      lastVideoTime = videoTime;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const videoAspect = videoWidth / videoHeight;
      let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
      if (videoAspect > ASPECT_RATIO) {
        sWidth = videoHeight * ASPECT_RATIO;
        sx = (videoWidth - sWidth) / 2;
      } else {
        sHeight = videoWidth / ASPECT_RATIO;
        sy = (videoHeight - sHeight) / 2;
      }
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      if (phase === 'idle') {
        const detectionResult = faceLandmarker.detectForVideo(video, performance.now());
        console.log("Detection result:", {
          hasLandmarks: !!detectionResult.faceLandmarks,
          landmarkCount: detectionResult.faceLandmarks?.length,
        });
        if (detectionResult.faceLandmarks && detectionResult.faceLandmarks.length > 0) {
          const landmarks = detectionResult.faceLandmarks[0];
          const leftEye = landmarks[33];
          const rightEye = landmarks[362];
          if (leftEye && rightEye) {
            const eyeDistance = Math.sqrt(
              Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
            );
            console.log("Eye distance:", eyeDistance);
            if (eyeDistance > 0.02 && eyeDistance < 0.15) {
              setPhase('countdown');
              setCountdown(3);
              console.log("Face detected, starting countdown");
            }
          } else {
            console.log("Eyes not detected in landmarks");
          }
        }
      } else if (phase === 'scanning') {
        if (animationStartTime.current === null) animationStartTime.current = performance.now();
        const animationDuration = 3000; // Scanning line duration
        const elapsed = performance.now() - animationStartTime.current;
        if (elapsed >= animationDuration && !isScanningLineDone) {
          setIsScanningLineDone(true); // Trigger thermal effect
          console.log("Scanning line complete, starting thermal effect");
        }
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        if (isScanningLineDone) {
          // Apply thermal effect after scanning line
          const thermalDuration = 2000; // 2 seconds for thermal effect
          const thermalProgress = Math.min((elapsed - animationDuration) / thermalDuration, 1);
          const easedProgress = 1 - Math.pow(1 - thermalProgress, 3);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const [r, g, b] = getThermalColor(gray);
            data[i] = data[i] * (1 - easedProgress) + r * easedProgress;
            data[i + 1] = data[i + 1] * (1 - easedProgress) + g * easedProgress;
            data[i + 2] = data[i + 2] * (1 - easedProgress) + b * easedProgress;
          }
          ctx.putImageData(imageData, 0, 0);
        }
      } else {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      }
      animationFrameId.current = requestAnimationFrame(processVideo);
    };
    animationFrameId.current = requestAnimationFrame(processVideo);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraReady, faceLandmarker, phase, isScanningLineDone]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;
        clearInterval(countdownInterval);
        // Go directly to scanning phase after countdown
        setPhase('scanning');
        setIsScanningLineDone(false); // Reset for scanning line
        animationStartTime.current = null;
        console.log("Countdown complete, starting scanning phase immediately");
        return 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'scanning') return;
    const resultTimeout = setTimeout(() => {
      const cool = Math.random() < 0.9;
      setIsCool(cool);
      setResult(
        cool
          ? "Cool vibes detected. Come on in!"
          : "Whoa, you're on fire — cool down and try again!"
      );
      setPhase('result');
      stopCamera();
    }, 7000); // 3s scanning line + 2s thermal effect
    return () => clearTimeout(resultTimeout);
  }, [phase]);

  if (phase === 'result' && result) {
return <ResultScreen isCool={isCool} />;
  }

  return (
    <div className="scanner-container">
      {phase === 'countdown' && (
        <div className="countdown-overlay">
          <CountdownDisplay value={countdown} />
        </div>
      )}
      <div className="camera-wrapper">
        <canvas ref={canvasRef} className="camera-canvas" width={WIDTH} height={HEIGHT} />
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
          style={{ display: "none" }}
        />
        <img src="./images/frame.png" className="frame-overlay" alt="Frame overlay" />
        {!isCameraReady && <StatusText>Initializing Camera...</StatusText>}
        {isCameraReady && phase === 'idle' && (
          <StatusText>Please look at the camera.</StatusText>
        )}
        {phase === 'scanning' && <ScanningLine />}
      </div>

      <style>{`
        .scanner-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: black;
        }
        .camera-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100vw;
          height: 100vh;
        }
        .camera-canvas {
          width: 100%;
          height: 100%;
          max-width: 100vw;
          max-height: 100vh;
          object-fit: cover;
          display: block;
          margin: auto;
          background: black;
        }
        .frame-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          max-width: 100vw;
          max-height: 100vh;
          object-fit: cover;
          pointer-events: none;
          z-index: 25;
        }
        .countdown-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 30;
          pointer-events: none;
        }
        .countdown {
          font-size: 12rem;
          font-weight: bold;
          color: white;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          animation: pingOnce 1s ease-in-out infinite;
        }
        @keyframes pingOnce {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};



const StatusText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    }}
  >
    <p
      style={{
        color: "white",
        fontSize: "2.25rem",
        fontWeight: "800",
        background: "rgba(0,0,0,0.7)",
        padding: "1rem",
        borderRadius: "0.5rem",
        backdropFilter: "blur(5px)",
        border: "1px solid rgba(34,211,238,0.3)",
      }}
    >
      {children}
    </p>
  </div>
);

const CountdownDisplay: React.FC<{ value: number }> = ({ value }) => (
  <div className="countdown">{value}</div>
);

export default ThermalScanner;