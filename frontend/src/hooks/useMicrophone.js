import { useState, useEffect, useRef, useCallback } from 'react';

export function useMicrophone() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [decibels, setDecibels] = useState(0);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const processorRef = useRef(null);
  const animFrameRef = useRef(null);
  const latestPcmChunkRef = useRef(null);

  const startMicrophone = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API not supported on this device/browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      // In-memory script processor to extract raw PCM chunks for classification
      // Note: ScriptProcessor is widely supported in all browsers for raw buffer reading
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Copy chunk
        const floatArray = new Float32Array(inputData);
        // Base64 encode float32 buffer
        const uint8 = new Uint8Array(floatArray.buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        latestPcmChunkRef.current = btoa(binary);
      };

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioCtx.destination);

      // Animation loop to calculate decibels
      const updateDecibels = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Map average magnitude 0-255 to roughly 30-100 dB
        const estimatedDb = Math.round(30 + (avg / 255) * 70);
        setDecibels(estimatedDb);

        animFrameRef.current = requestAnimationFrame(updateDecibels);
      };

      updateDecibels();

      setHasPermission(true);
      setIsMicActive(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setHasPermission(false);
      setIsMicActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone permission was denied. Please allow audio access in browser settings.");
      } else if (err.name === 'NotFoundError') {
        setErrorMessage("No audio recording device detected on this computer.");
      } else {
        setErrorMessage(err.message || "Failed to initialize microphone.");
      }
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    latestPcmChunkRef.current = null;
    setIsMicActive(false);
    setDecibels(0);
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (isMicActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }, [isMicActive, startMicrophone, stopMicrophone]);

  const getLatestPcmChunk = useCallback(() => {
    return latestPcmChunkRef.current;
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return null;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    hasPermission,
    isMicActive,
    errorMessage,
    decibels,
    startMicrophone,
    stopMicrophone,
    toggleMicrophone,
    getLatestPcmChunk,
    getFrequencyData
  };
}
