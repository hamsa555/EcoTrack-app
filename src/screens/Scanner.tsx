import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, ChevronLeft, Zap, RotateCw, CheckCircle2, XCircle, Info, Leaf, RotateCcw, Loader2 } from 'lucide-react';
import { analyzeWaste } from '../services/geminiService';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';
import { Screen } from '../types';

interface ScanResult {
  item: string;
  recyclable: boolean;
  instructions: string;
  co2Saved: number;
}

interface ScannerProps {
  setScreen: (screen: Screen) => void;
}

export default function Scanner({ setScreen }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment'); // Default to back camera for scanning
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facing]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      setError(null);
      let newStream: MediaStream;

      try {
        // Try with specific facing mode
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
      } catch (innerErr) {
        console.warn("Retrying camera with generic constraints...", innerErr);
        // Fallback: Try any available video device
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(newStream);
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setPermissionGranted(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please enable it in settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found on this device.");
      } else {
        setError("Camera error: " + (err.message || "Unknown error"));
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.5);
      
      const analysis = await analyzeWaste(base64);
      setResult(analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI Analysis failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const logActivity = async () => {
    if (!result || !auth.currentUser) return;
    
    try {
      const points = result.recyclable ? 50 : 10;
      
      // Log activity
      await addDoc(collection(db, 'activities'), {
        userId: auth.currentUser.uid,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        type: 'recycling',
        item: result.item,
        points: points,
        impact: result.co2Saved,
        timestamp: serverTimestamp()
      });

      // Update user stats
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        points: increment(points),
        co2Saved: increment(result.co2Saved),
        score: increment(2)
      });

      setResult(null);
      notificationService.send(
        "Earth Hero Logged!",
        `You just saved ${result.co2Saved}kg of CO2 by properly managing ${result.item}.`,
        "impact"
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'activities');
    }
  };

  if (permissionGranted === false) {
    return (
      <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-6 text-center space-y-6 min-h-screen">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <XCircle size={40} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Camera Restricted</h2>
          <p className="text-gray-400 text-sm font-medium">We need your permission to use your camera for AI classification.</p>
        </div>
        <button 
          onClick={startCamera}
          className="bg-[#5CB338] text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-transform"
        >
          Enable Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-black min-h-screen overflow-hidden flex flex-col font-sans">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 bg-black/30 flex flex-col z-10">
        {/* Top Bar */}
        <header className="flex justify-between items-center px-5 pt-10">
          <button 
            onClick={() => setScreen('dashboard')}
            className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-white text-lg font-black italic uppercase tracking-tight">EcoScan AI</h2>
            <div className="flex items-center gap-2 bg-[#5CB338]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#5CB338]/30 mt-1">
              <div className="w-1.5 h-1.5 bg-[#5CB338] rounded-full animate-pulse" />
              <span className="text-[#5CB338] text-[8px] font-black uppercase tracking-widest">Live Analysis</span>
            </div>
          </div>

          <button 
            onClick={() => setFacing(prev => prev === 'environment' ? 'user' : 'environment')}
            className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
          >
            <RotateCcw size={20} className="text-white" />
          </button>
        </header>

        {/* Framing Guide */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="relative w-full max-w-[280px] aspect-square">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/60 rounded-tl-[2rem]" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/60 rounded-tr-[2rem]" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/60 rounded-bl-[2rem]" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/60 rounded-br-[2rem]" />
            
            {isScanning && (
              <div className="absolute left-4 right-4 h-0.5 bg-[#5CB338] shadow-[0_0_15px_#5CB338] animate-scan" />
            )}
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="px-5 pb-8 flex flex-col items-center space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-500/30">
              <XCircle size={12} className="text-red-300" />
              <p className="text-red-100 text-[10px] font-black italic">{error}</p>
            </div>
          )}

          {!result ? (
            <div className="flex flex-col items-center w-full max-w-sm">
              <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Frame item to identify</p>
              
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="w-20 h-20 bg-white/10 rounded-full p-1.5 border border-white/20 active:scale-95 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full p-1">
                  <div className="w-full h-full border-2 border-dashed border-[#5CB338] rounded-full flex items-center justify-center">
                    {isScanning ? (
                      <RotateCw size={24} className="text-[#5CB338] animate-spin" />
                    ) : (
                      <div className="w-8 h-8 bg-[#5CB338] rounded-full shadow-lg shadow-[#5CB338]/40" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 max-h-[500px] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-[#5CB338] uppercase tracking-widest block mb-1">AI Result Loaded</span>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">{result.item}</h3>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${result.recyclable ? 'bg-green-50' : 'bg-red-50'}`}>
                  {result.recyclable ? <CheckCircle2 size={28} className="text-[#5CB338]" /> : <XCircle size={28} className="text-red-500" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-2xl space-y-0.5">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Status</span>
                  <p className={`text-[11px] font-black uppercase ${result.recyclable ? 'text-[#5CB338]' : 'text-red-500'}`}>
                    {result.recyclable ? 'RECYCLABLE' : 'NON-RECYCLABLE'}
                  </p>
                </div>
                <div className="bg-[#2F5233] p-3.5 rounded-2xl space-y-0.5">
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">CO2 Offset</span>
                  <div className="flex items-center gap-1">
                    <Leaf size={12} className="text-[#5CB338]" fill="currentColor" />
                    <p className="text-[11px] font-black text-white">{result.co2Saved}kg</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-gray-500 leading-relaxed">{result.instructions}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={logActivity}
                  className="flex-2 bg-[#5CB338] text-white py-4 rounded-xl text-xs font-black italic uppercase tracking-widest shadow-lg shadow-[#5CB338]/20 active:scale-95 transition-transform"
                >
                  LOG & EARN
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl text-[10px] font-black italic uppercase tracking-widest active:scale-95 transition-transform"
                >
                  DISCARD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 1rem; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 1rem); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}} />
    </div>
  );
}
