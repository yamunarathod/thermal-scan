import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import ResultScreen from './ResultScreen';
import ScanningLine from './ScanningLine';

// Thermal color mapping function remains the same
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


const ThermalScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const animationFrameId = useRef<number>();

  // 1. Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `/pose_landmarker_lite.task`, // Ensure model is in public folder
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      setPoseLandmarker(landmarker);
    };
    createPoseLandmarker();
  }, []);

  // 2. Start the camera when the component mounts
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Could not access the camera. Please check permissions.");
      }
    };
    startCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Main detection and scanning loop
  useEffect(() => {
    let lastVideoTime = -1;

    const processVideo = () => {
      if (!isCameraReady || !videoRef.current || !poseLandmarker) {
        animationFrameId.current = requestAnimationFrame(processVideo);
        return;
      }

      const video = videoRef.current;
      const videoTime = video.currentTime;

      if (video.paused || video.ended || videoTime === lastVideoTime) {
        animationFrameId.current = requestAnimationFrame(processVideo);
        return;
      }
      lastVideoTime = videoTime;
      
      // Person detection logic
      if (!isPersonDetected && !isScanning && !result) {
        const detectionResult = poseLandmarker.detectForVideo(video, Date.now());
        if (detectionResult.landmarks.length > 0) {
          setIsPersonDetected(true);
        }
      }

      // Thermal effect rendering
      if (isScanning) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const [r, g, b] = getThermalColor(gray);
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      
      animationFrameId.current = requestAnimationFrame(processVideo);
    };

    animationFrameId.current = requestAnimationFrame(processVideo);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraReady, poseLandmarker, isPersonDetected, isScanning, result]);

  // 4. Countdown logic
  useEffect(() => {
    if (isPersonDetected) {
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);

      const scanTimeout = setTimeout(() => {
        clearInterval(countdownInterval);
        setIsPersonDetected(false);
        setIsScanning(true);
      }, 3000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(scanTimeout);
      };
    }
  }, [isPersonDetected]);
  
  // 5. Scanning duration and result generation
  useEffect(() => {
    if (isScanning) {
      const resultTimeout = setTimeout(() => {
        const cool = Math.random() < 0.9;
        setResult(
          cool
            ? 'Cool vibes detected. Come on in!'
            : 'Whoa, you’re on fire — cool down and try again!'
        );
        setIsScanning(false);
        stopCamera();
      }, 7000); // Scan for 7 seconds

      return () => clearTimeout(resultTimeout);
    }
  }, [isScanning]);
  
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
    }
  };

  if (result) {
    return <ResultScreen message={result} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="relative mb-4 flex items-center justify-center w-full max-w-md">
        <canvas ref={canvasRef} className="w-full rounded-lg" />
        <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        
        {/* UI Overlays */}
        {!isCameraReady && <StatusText>Initializing Camera...</StatusText>}
        {isCameraReady && !isPersonDetected && !isScanning && <StatusText>Please stand in front of the camera.</StatusText>}
        {countdown !== null && <CountdownDisplay value={countdown} />}
        {isScanning && <ScanningLine />}
      </div>
    </div>
  );
};

// Helper components for UI overlays
const StatusText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="absolute text-white text-2xl font-semibold bg-black/50 p-4 rounded-lg">{children}</p>
);

const CountdownDisplay: React.FC<{ value: number }> = ({ value }) => (
    <div className="absolute text-white font-bold text-9xl animate-ping-once">{value}</div>
);


export default ThermalScanner;