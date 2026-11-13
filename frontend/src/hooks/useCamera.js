import { useState, useEffect, useRef, useCallback } from 'react';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState(null); // null: prompt, true: granted, false: denied
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());

  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or insecure context (HTTPS or localhost required).");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Camera permission was denied. Please allow camera access in browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage("No video camera hardware detected on this device.");
      } else {
        setErrorMessage(err.message || "Failed to initialize camera.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Capture current video frame as base64 JPEG
  const captureFrameBase64 = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isCameraActive || video.readyState < 2) {
      return null;
    }

    const canvas = canvasRef.current;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsCalcRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;
    }

    return canvas.toDataURL('image/jpeg', 0.65);
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    hasPermission,
    isCameraActive,
    errorMessage,
    fps,
    startCamera,
    stopCamera,
    toggleCamera,
    captureFrameBase64
  };
}
