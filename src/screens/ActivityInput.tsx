import React, { useState, useEffect, useRef } from 'react';
import { Car, Bus, Footprints, Utensils, ChevronLeft, Bike, Recycle, RefreshCw, Camera, X, Zap, Trees, Droplets, Sun, Leaf, MousePointer2, Timer, Loader2, Sparkles } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, setDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Screen } from '../types';
import { notificationService } from '../services/notificationService';
import { useStepTracker } from '../hooks/useStepTracker';
import { analyzeMission } from '../services/geminiService';

interface ActivityInputProps {
  setScreen: (screen: Screen) => void;
}

export default function ActivityInput({ setScreen }: ActivityInputProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('0');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ points: number, co2Saved: number, tag: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isTracking, steps, startTracking, stopTracking } = useStepTracker();

  useEffect(() => {
    if (isTracking && selected === 'walk') {
      setAmount(steps.toString());
    }
  }, [steps, isTracking, selected]);

  const activities = [
    { id: 'car', icon: Car, label: 'Car', factor: -0.17, unit: 'km', pointsPerUnit: 0, color: '#EF4444' },
    { id: 'bus', icon: Bus, label: 'Bus', factor: 0.08, unit: 'km', pointsPerUnit: 10, color: '#3B82F6' },
    { id: 'walk', icon: Footprints, label: 'Walking', factor: 0.05, unit: 'steps', pointsPerUnit: 0.01, color: '#10B981' },
    { id: 'meal', icon: Utensils, label: 'Plant Meal', factor: 0.85, unit: 'servings', pointsPerUnit: 25, color: '#F97316' },
    { id: 'bike', icon: Bike, label: 'Bike', factor: 0.17, unit: 'km', pointsPerUnit: 20, color: '#6366F1' },
    { id: 'recycle', icon: Recycle, label: 'Recycle', factor: 0.35, unit: 'items', pointsPerUnit: 5, color: '#06B6D4' },
    { id: 'tree', icon: Trees, label: 'Tree', factor: 22.0, unit: 'planted', pointsPerUnit: 100, color: '#059669' },
    { id: 'water', icon: Droplets, label: 'Save Water', factor: 0.05, unit: 'liters', pointsPerUnit: 2, color: '#0EA5E9' },
    { id: 'solar', icon: Sun, label: 'Renewable', factor: 0.52, unit: 'kWh', pointsPerUnit: 12, color: '#EAB308' },
    { id: 'compost', icon: Leaf, label: 'Compost', factor: 1.4, unit: 'kg', pointsPerUnit: 30, color: '#D97706' },
  ];

  const selectedActivity = activities.find(a => a.id === selected);
  const amountNum = parseFloat(amount) || 0;
  
  const calculatedImpact = aiResult ? aiResult.co2Saved : (selectedActivity ? Number((amountNum * selectedActivity.factor).toFixed(2)) : 0);
  const calculatedPoints = aiResult ? aiResult.points : (selectedActivity ? Math.floor(amountNum * selectedActivity.pointsPerUnit) : 0);

  const handleAiAnalyze = async () => {
    if (!comment || !selected) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMission(comment, selectedActivity?.label || selected);
      if (result) {
        setAiResult(result);
        notificationService.send("AI Analysis Ready", "Impact metrics have been updated based on your description.", "impact");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImagePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selected || !auth.currentUser || amountNum <= 0) return;
    
    setIsSubmitting(true);

    try {
        const activityData = {
          userId: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Eco Warrior',
          photoURL: auth.currentUser.photoURL || null,
          type: selectedActivity?.label || selected,
          impact: calculatedImpact,
          points: calculatedPoints,
          amount: amountNum,
          unit: selectedActivity?.unit,
          comment: comment.trim() || `Logged ${amount} ${selectedActivity?.unit} of ${selectedActivity?.label}`,
          imageUrl: imageUrl || null,
          timestamp: serverTimestamp(),
          isSocial: false
        };

        await setDoc(doc(collection(db, `users/${auth.currentUser.uid}/activities`)), activityData);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const statsUpdate: any = {
        points: increment(calculatedPoints),
        co2Saved: increment(calculatedImpact),
        score: increment(calculatedPoints),
        updatedAt: serverTimestamp(),
      };

      if (selected === 'walk') {
        statsUpdate.steps = increment(amountNum);
      }

      await updateDoc(userRef, statsUpdate);

      notificationService.send(
        "Mission Recorded!",
        `Great job choosing ${selectedActivity?.label}! Impact recorded.`,
        "impact"
      );

      setScreen('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'activities');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F7FBF4] min-h-screen px-5 pt-10 pb-32 max-w-lg mx-auto space-y-8 font-sans overflow-y-auto">
      <header className="flex items-center gap-3">
        <button 
          onClick={() => setScreen('dashboard')}
          className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <h1 className="text-xl font-black text-gray-900 leading-none">Post <span className="text-[#5CB338]">Mission</span></h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => setSelected(activity.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all shadow-sm ${
              selected === activity.id 
                ? 'bg-[#1A1C19] border-[#1A1C19] shadow-xl shadow-black/10 scale-[1.02]' 
                : 'bg-white border-transparent hover:border-[#5CB338]/20'
            }`}
          >
            <activity.icon 
              size={32} 
              className={selected === activity.id ? 'text-white' : 'text-[#5CB338]'}
            />
            <span className={`text-[9px] font-black uppercase tracking-widest mt-3 ${
              selected === activity.id ? 'text-white' : 'text-gray-400'
            }`}>
              {activity.label}
            </span>
            <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${
              selected === activity.id ? 'bg-white/20 text-white' : 'bg-[#F7FBF4] text-[#5CB338]'
            }`}>
              {activity.unit}
            </div>
          </button>
        ))}
      </div>

      {selectedActivity && (
        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[#5CB338]/10 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-900 italic uppercase tracking-tight">Volume</h3>
            {selected === 'walk' && (
              <button
                onClick={() => isTracking ? stopTracking() : startTracking()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isTracking ? 'bg-red-500 text-white' : 'bg-[#F7FBF4] text-[#5CB338]'
                }`}
              >
                {isTracking ? <Timer size={12} className="animate-spin" /> : <MousePointer2 size={12} />}
                {isTracking ? "Live..." : "Auto-Track"}
              </button>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 border-b-2 border-[#5CB338]/10 pb-1">
            <input 
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (isTracking) stopTracking();
              }}
              className="text-3xl font-black text-[#1A1C19] bg-transparent outline-none text-right w-full"
            />
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{selectedActivity.unit}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block">Mission Intelligence</label>
            {comment.length > 10 && !aiResult && (
              <button 
                onClick={handleAiAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-[9px] font-black text-[#5CB338] uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                Smart Analysis
              </button>
            )}
          </div>
          <p className="text-[11px] font-black text-gray-900 mb-3">Describe your environmental effort</p>
          <div className="relative">
            <textarea 
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setAiResult(null);
              }}
              rows={3}
              placeholder="e.g. 'Spent 30 minutes cleaning the park'"
              className="w-full bg-white p-5 rounded-[2rem] text-xs font-bold text-gray-700 placeholder-gray-200 border-2 border-gray-50 shadow-sm focus:border-[#5CB338]/20 outline-none transition-all resize-none"
            />
            {aiResult && (
              <div className="absolute top-4 right-4 bg-[#5CB338]/10 text-[#5CB338] px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                <Sparkles size={8} /> Verified
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Visual Evidence</label>
          <p className="text-[11px] font-black text-[#5CB338] mb-3">Upload a photo of your impact</p>
          
          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 hover:border-[#5CB338]/20 transition-all active:scale-95"
            >
              <Camera size={24} className="text-gray-300" />
              <span className="text-[9px] font-black uppercase text-gray-400">Capture</span>
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImagePicker}
              accept="image/*"
              className="hidden"
            />

            {imageUrl && (
              <div className="relative w-24 h-24">
                <img src={imageUrl} className="w-full h-full rounded-[2rem] object-cover border-2 border-white shadow-md" alt="Preview" />
                <button 
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white text-white shadow-sm"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1A1C19] p-6 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5CB338]/10 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-[#5CB338]" fill="currentColor" />
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Reward</p>
            <p className="text-base font-black text-white leading-tight mt-1">+{calculatedPoints} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Offset</p>
          <p className="text-base font-black text-[#5CB338] leading-tight mt-1">{calculatedImpact} kg</p>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !selected || amountNum <= 0}
        className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-2 transition-all relative overflow-hidden ${
          (!isSubmitting && selected && amountNum > 0) 
            ? 'bg-[#5CB338] shadow-xl shadow-[#5CB338]/30 active:scale-[0.98]' 
            : 'bg-gray-200 opacity-50'
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <>
            <span className={`text-base font-black uppercase tracking-widest ${
              (!isSubmitting && selected && amountNum > 0) ? 'text-white' : 'text-gray-400'
            }`}>Sync Mission</span>
            <Zap size={18} className={(!isSubmitting && selected && amountNum > 0) ? 'text-white' : 'text-gray-400'} fill="currentColor" />
          </>
        )}
      </button>
    </div>
  );
}
