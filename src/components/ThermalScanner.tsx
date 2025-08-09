"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import ResultScreen from "./ResultScreen"

// Define a more detailed set of phases for the animation sequence
type Phase = "idle" | "countdown" | "scanDown" | "thermalHoldAfterDown" | "scanUp" | "thermalHoldAfterUp" | "result"

const getThermalColor = (intensity: number): [number, number, number] => {
  const normalized = Math.max(0, Math.min(1, intensity / 255))
  if (normalized < 0.3) {
    // Dark Blue to Cyan (extended range)
    const t = normalized / 0.3
    return [0, Math.floor(t * 255), 255]
  } else if (normalized < 0.35) {
    // Cyan to Very Mild Green (short range)
    const t = (normalized - 0.3) / 0.05
    return [0, 255, Math.floor(255 * (1 - t))]
  } else if (normalized < 0.5) {
    // Mild Green to Yellow (starts and ends faster)
    const t = (normalized - 0.35) / 0.15
    return [Math.floor(t * 255), 255, 0]
  } else if (normalized < 0.75) {
    // Yellow to Red
    const t = (normalized - 0.5) / 0.25
    return [255, Math.floor(255 * (1 - t)), 0]
  } else {
    // Red to Orange
    const t = (normalized - 0.75) / 0.25
    return [255, Math.floor(t * 165), 0]
  }
}

const ASPECT_RATIO = 9 / 16
const WIDTH = 720
const HEIGHT = Math.round(WIDTH / ASPECT_RATIO)

// Simple Lottie component using iframe
const LottieCountdown: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Listen for the animation completion
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "lottie-complete" && !isCompleted) {
        setIsCompleted(true)
        onComplete()
      }
    }

    window.addEventListener("message", handleMessage)

    // Fallback timer in case the event doesn't fire - give it more time for full countdown
    const fallbackTimer = setTimeout(() => {
      if (!isCompleted) {
        setIsCompleted(true)
        onComplete()
      }
    }, 4000) // Increased to 4 seconds to ensure full countdown

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(fallbackTimer)
    }
  }, [onComplete, isCompleted])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
        background: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(2px)",
      }}
    >
      <iframe
        src="data:text/html;charset=utf-8,%3Chtml%3E%3Chead%3E%3Cscript src='https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js' type='module'%3E%3C/script%3E%3C/head%3E%3Cbody style='margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;height:100vh;'%3E%3Cdotlottie-wc src='https://lottie.host/e5113891-a79e-4395-a656-76372b815e5c/0kJGXH5ssH.lottie' style='width: 1000px;height: 1000px' speed='1' autoplay%3E%3C/dotlottie-wc%3E%3C/body%3E%3Cscript%3Edocument.querySelector('dotlottie-wc').addEventListener('complete', () => %7B parent.postMessage('lottie-complete', '*'); %7D);%3C/script%3E%3C/body%3E%3C/html%3E"
        style={{
          width: "1000px",
          height: "1000px",
          border: "none",
          background: "transparent",
        }}
        title="Countdown Animation"
      />
    </div>
  )
}

// Animated Temperature Display Component
const AnimatedTemperatureDisplay: React.FC<{ targetTemp: number; isVisible: boolean }> = ({
  targetTemp,
  isVisible,
}) => {
  const [currentTemp, setCurrentTemp] = useState(10)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (!isVisible) {
      setCurrentTemp(10)
      return
    }

    startTimeRef.current = Date.now()

    const animate = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0)
      const duration = 2000 // 2 seconds total animation

      if (elapsed >= duration) {
        setCurrentTemp(targetTemp)
        return
      }

      // Easing function that slows down near the target
      const progress = elapsed / duration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      // Calculate current temperature with easing
      const tempRange = targetTemp - 10
      const newTemp = 10 + tempRange * easeOutQuart

      setCurrentTemp(Math.round(newTemp * 10) / 10) // Round to 1 decimal place

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetTemp, isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10%", // Position at bottom
        left: "50%",
        transform: "translateX(-50%)", // Center horizontally only
        zIndex: 20,
        pointerEvents: "none",
        color: "#ffffff",
        fontSize: "4rem",
        fontWeight: 900,
        fontFamily: '"Orbitron", "Courier New", monospace', // Tech-style font
        textShadow: "0 0 8px rgba(255, 255, 255, 0.7), 0 0 15px #00ff88, 0 0 25px #00ff88",
        animation: "temperatureGlow 2s ease-in-out infinite alternate",
      }}
    >
      {currentTemp.toFixed(1)}°
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        @keyframes temperatureGlow {
          0% { 
            textShadow: 0 0 8px rgba(255, 255, 255, 0.7), 0 0 15px #00ff88, 0 0 25px #00ff88;
          }
          100% { 
            textShadow: 0 0 12px rgba(255, 255, 255, 0.9), 0 0 20px #00ff88, 0 0 35px #00ff88, 0 0 45px #00ff88;
          }
        }
      `}</style>
    </div>
  )
}

const ThermalScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [result, setResult] = useState<string | null>(null)
  const [isCool, setIsCool] = useState<boolean>(false)
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [thermalProgress, setThermalProgress] = useState<number>(0)
  const [targetTemperature, setTargetTemperature] = useState<number>(0)
  const [showTemperature, setShowTemperature] = useState(false)
  const animationFrameId = useRef<number | undefined>(undefined)
  const phaseStartTime = useRef<number>(0)

  // This central useEffect hook manages all phase transitions with timeouts
  useEffect(() => {
    phaseStartTime.current = Date.now()

    if (phase === "scanDown") {
      const timer = setTimeout(() => setPhase("thermalHoldAfterDown"), 3000)
      return () => clearTimeout(timer)
    }
    if (phase === "thermalHoldAfterDown") {
      const timer = setTimeout(() => setPhase("scanUp"), 3000)
      return () => clearTimeout(timer)
    }
    if (phase === "scanUp") {
      const timer = setTimeout(() => setPhase("thermalHoldAfterUp"), 3000)
      return () => clearTimeout(timer)
    }

    if (phase === "thermalHoldAfterUp") {
      // Decide the outcome at the beginning of this phase
      const cool = Math.random() < 0.9
      setIsCool(cool)
      setResult(cool ? "Cool vibes detected. Come on in!" : "Whoa, you're on fire — cool down and try again!")

      // Set target temperature and show it after 1 second
      const tempTimer = setTimeout(() => {
        const tempValue = cool
          ? Math.random() * 10 + 80 // 80.0 to 90.0
          : Math.random() * 10 + 90 // 90.0 to 100.0
        setTargetTemperature(tempValue)
        setShowTemperature(true)
      }, 1000) // 1-second delay

      // Hold this phase for 5 seconds before moving to the result
      // (1 second delay + 2 seconds animation + 2 seconds display = 5 seconds total)
      const phaseTimer = setTimeout(() => {
        setPhase("result")
        stopCamera()
      }, 5000) // Changed from 3000 to 5000

      // Ensure both timers are cleared on cleanup
      return () => {
        clearTimeout(tempTimer)
        clearTimeout(phaseTimer)
      }
    }
  }, [phase])

  // This useEffect handles the video processing and thermal effect application
  useEffect(() => {
    let lastVideoTime = -1
    const processVideo = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !isCameraReady) {
        animationFrameId.current = requestAnimationFrame(processVideo)
        return
      }

      const ctx = canvas.getContext("2d")
      if (!ctx || video.paused || video.ended || video.currentTime === lastVideoTime) {
        animationFrameId.current = requestAnimationFrame(processVideo)
        return
      }
      lastVideoTime = video.currentTime

      // Set canvas size to match its display size
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Scale to fill height (vertical priority) - crop sides if needed
      const videoAspectRatio = video.videoWidth / video.videoHeight
      const canvasAspectRatio = canvas.width / canvas.height

      let drawWidth, drawHeight, offsetX, offsetY

      // Always fit by height to fill the vertical space completely
      drawHeight = canvas.height
      drawWidth = drawHeight * videoAspectRatio

      // Center horizontally (may crop sides if video is too wide)
      offsetX = (canvas.width - drawWidth) / 2
      offsetY = 0

      // Apply horizontal flip transform for mirroring
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)

      // Draw the video frame
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

      ctx.restore()

      const now = Date.now()
      const elapsed = now - phaseStartTime.current

      let currentThermalProgress = 0

      if (phase === "thermalHoldAfterDown") {
        currentThermalProgress = Math.min(1, elapsed / 3000)
      } else if (phase === "thermalHoldAfterUp") {
        currentThermalProgress = Math.min(1, elapsed / 3000)
      } else if (phase === "result") {
        currentThermalProgress = Math.max(0, 1 - elapsed / 1000)
      }

      setThermalProgress(currentThermalProgress)

      const isThermalPhase = phase === "thermalHoldAfterDown" || phase === "thermalHoldAfterUp" || phase === "result"
      if (isThermalPhase && currentThermalProgress > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const [thermalR, thermalG, thermalB] = getThermalColor(gray)

          data[i] = Math.floor(data[i] * (1 - currentThermalProgress) + thermalR * currentThermalProgress)
          data[i + 1] = Math.floor(data[i + 1] * (1 - currentThermalProgress) + thermalG * currentThermalProgress)
          data[i + 2] = Math.floor(data[i + 2] * (1 - currentThermalProgress) + thermalB * currentThermalProgress)
        }
        ctx.putImageData(imageData, 0, 0)
      }

      if (phase === "idle" && faceLandmarker) {
        const detectionResult = faceLandmarker.detectForVideo(video, performance.now())
        if (detectionResult.faceLandmarks && detectionResult.faceLandmarks.length > 0) {
          setPhase("countdown")
        }
      }

      animationFrameId.current = requestAnimationFrame(processVideo)
    }

    animationFrameId.current = requestAnimationFrame(processVideo)
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [isCameraReady, faceLandmarker, phase])

  // Restart logic
  useEffect(() => {
    if (phase !== "result") return

    const restartTimeout = setTimeout(() => {
      setResult(null)
      setIsCool(false)
      setTargetTemperature(0)
      setShowTemperature(false)
      setPhase("idle")
      setThermalProgress(0)
      startCamera()
    }, 5000)

    return () => clearTimeout(restartTimeout)
  }, [phase])

  // MediaPipe FaceLandmarker setup
  useEffect(() => {
    const createFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
        )
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `./face_landmarker.task`, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.3,
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        })
        setFaceLandmarker(landmarker)
      } catch (error) {
        console.error("Error initializing face landmarker:", error)
        alert("Failed to initialize face detection. Please ensure the model file is accessible.")
      }
    }

    createFaceLandmarker()
  }, [])

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.error("Error playing video:", err))
          setIsCameraReady(true)
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access the camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraReady(false)
  }

  const handleCountdownComplete = () => {
    setPhase("scanDown")
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  if (phase === "result" && result) {
    return <ResultScreen message={result} isCool={isCool} />
  }

  return (
    <div className="scanner-container">
      {phase === "countdown" && <LottieCountdown onComplete={handleCountdownComplete} />}
      <div className="camera-wrapper">
        <canvas ref={canvasRef} className="camera-canvas" />
        <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
        <img src="./images/frame.png" className="frame-overlay" alt="Frame overlay" />

        {!isCameraReady && <StatusText>Initializing Camera...</StatusText>}
        {isCameraReady && phase === "idle" && <StatusText>Please look at the camera.</StatusText>}

        {(phase === "scanDown" || phase === "scanUp") && <ScanningLine direction={phase} />}

        <AnimatedTemperatureDisplay targetTemp={targetTemperature} isVisible={showTemperature} />
      </div>

      <style>{`
        .scanner-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: black;
        }

        .camera-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .camera-canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: black;
        }

        .frame-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          z-index: 25;
        }
      `}</style>
    </div>
  )
}

const StatusText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
      pointerEvents: "none",
    }}
  >
    <p
      style={{
        color: "white",
        fontSize: "2.25rem",
        fontWeight: "800",
        background: "rgba(0,0,0,0.7)",
        padding: "1rem 2rem",
        borderRadius: "0.5rem",
        backdropFilter: "blur(5px)",
        border: "1px solid rgba(34,211,238,0.3)",
      }}
    >
      {children}
    </p>
  </div>
)

const ScanningLine: React.FC<{ direction: "scanDown" | "scanUp" }> = ({ direction }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, transparent, #00ff88, #00ccff, #00ff88, transparent)",
        boxShadow: "0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88",
        zIndex: 20,
        animation: direction === "scanDown" ? "scanDown 3s linear" : "scanUp 3s linear",
      }}
    >
      <style>{`
        @keyframes scanDown {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes scanUp {
          0% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  )
}

export default ThermalScanner
