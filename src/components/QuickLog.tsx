import React, { useState, useEffect } from 'react';
import { Car, Bus, Footprints, Utensils, Bike, Recycle, RefreshCw, Camera, X, Zap, ChevronDown, ChevronUp, Trees, Plane, Timer, MousePointer2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';
import { useStepTracker } from '../hooks/useStepTracker';
import { cn } from '../lib/utils';

export default function QuickLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isTracking, steps, startTracking, stopTracking } = useStepTracker();

  useEffect(() => {
    if (isTracking && selected === 'walk') {
      setAmount(steps);
    }
  }, [steps, isTracking, selected]);

  const activities = [
    { id: 'walk', icon: Footprints, label: 'Walking', factor: 0.05, unit: 'steps', pointsPerUnit: 0.01 },
    { id: 'bike', icon: Bike, label: 'Bike', factor: 0.17, unit: 'km', pointsPerUnit: 20 },
    { id: 'meal', icon: Utensils, label: 'Meal', factor: 0.85, unit: 'servings', pointsPerUnit: 25 },
    { id: 'recycle', icon: Recycle, label: 'Recycle', factor: 0.35, unit: 'items', pointsPerUnit: 5 },
    { id: 'tree', icon: Trees, label: 'Tree', factor: 22.0, unit: 'planted', pointsPerUnit: 100 },
  ];

  const selectedActivity = activities.find(a => a.id === selected);
  const calculatedImpact = selectedActivity ? Number((amount * selectedActivity.factor).toFixed(2)) : 0;
  const calculatedPoints = selectedActivity ? Math.floor(amount * selectedActivity.pointsPerUnit) : 0;

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
    if (!selected || !auth.currentUser || amount <= 0) return;
    
    setIsSubmitting(true);

    try {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/activities`), {
          userId: auth.currentUser.uid,
          displayName: auth.currentUser.displayName,
          photoURL: auth.currentUser.photoURL,
          type: selectedActivity?.label || selected,
          impact: calculatedImpact,
          points: calculatedPoints,
          amount: amount,
          unit: selectedActivity?.unit,
          comment: comment.trim() || `Instant Log: ${selectedActivity?.label}`,
          imageUrl: imageUrl,
          timestamp: serverTimestamp(),
          isSocial: false
        });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const statsUpdate: any = {
        points: increment(calculatedPoints),
        co2Saved: increment(calculatedImpact),
        score: increment(calculatedPoints),
        updatedAt: serverTimestamp(),
      };

      if (selected === 'walk') {
        statsUpdate.steps = increment(amount);
      }

      await updateDoc(userRef, statsUpdate);

      notificationService.send(
        "Instant Log Saved!",
        `Mission accomplished! +${calculatedPoints} XP added.`,
        "impact"
      );

      setSelected(null);
      setAmount(0);
      setComment('');
      setImageUrl(null);
      setIsOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'activities');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-6 bg-white rounded-[2.5rem] flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-all",
          isOpen && "rounded-b-none border-b-0"
        )}
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-[#F7FBF4] rounded-2xl flex items-center justify-center">
            <Zap size={24} className="text-[#5CB338]" fill="#5CB338" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 leading-none">Instant Log</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">Rapid Mission Sync</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-[#5CB338]" /> : <ChevronDown size={20} className="text-gray-300" />}
      </button>

      {isOpen && (
        <div className="bg-white p-6 rounded-b-[3rem] border border-gray-100 border-t-0 shadow-sm space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between gap-3">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => setSelected(activity.id)}
                  className={cn(
                    "flex-1 h-12 rounded-2xl flex items-center justify-center transition-all",
                    selected === activity.id ? "bg-eco-dark text-white ring-4 ring-eco-primary/10" : "bg-gray-50 text-eco-primary"
                  )}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>

          {selectedActivity && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                    {selectedActivity.label} ({selectedActivity.unit})
                  </p>
                  {selected === 'walk' && (
                    <button
                      onClick={() => isTracking ? stopTracking() : startTracking()}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all",
                        isTracking ? "bg-red-500 text-white" : "bg-gray-100 text-[#5CB338]"
                      )}
                    >
                      {isTracking ? <Timer size={10} className="animate-pulse" /> : <MousePointer2 size={10} />}
                      <span className="text-[8px] font-black uppercase tracking-tight">
                        {isTracking ? "Tracking..." : "Auto Mode"}
                      </span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <input 
                    type="number"
                    className="w-16 bg-transparent text-xl font-black text-gray-900 border-b-2 border-eco-primary/20 outline-none text-right"
                    value={amount}
                    onChange={(e) => {
                        setAmount(parseInt(e.target.value) || 0);
                        if (isTracking) stopTracking();
                    }}
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase mt-auto pb-1">{selectedActivity.unit}</span>
                </div>
              </div>

              <input 
                type="range"
                className="w-full h-2 bg-gray-50 rounded-full appearance-none cursor-pointer accent-[#5CB338]"
                min="0"
                max={selectedActivity.id === 'walk' ? 10000 : 50}
                step={selectedActivity.id === 'walk' ? 100 : 1}
                value={amount}
                onChange={(e) => {
                    setAmount(parseInt(e.target.value));
                    if (isTracking) stopTracking();
                }}
              />

              <div className="flex bg-[#F7FBF4]/50 rounded-2xl p-4 divide-x divide-white">
                <div className="flex-1 text-center space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Impact</p>
                  <p className="text-sm font-black text-gray-900">{calculatedImpact}kg</p>
                </div>
                <div className="flex-1 text-center space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">XP Gain</p>
                  <p className="text-sm font-black text-[#5CB338]">+{calculatedPoints}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 items-start">
            <label className="relative shrink-0 w-20 h-20 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden group hover:border-[#5CB338]/30 transition-colors">
              {imageUrl ? (
                <img src={imageUrl} className="w-full h-full object-cover" alt="Log" />
              ) : (
                <>
                  <Camera size={24} className="text-[#5CB338] mb-1" />
                  <span className="text-[8px] font-black text-gray-400 uppercase">Proof</span>
                </>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleImagePicker} />
              {imageUrl && (
                <button 
                  onClick={(e) => { e.preventDefault(); setImageUrl(null); }}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white shadow-sm"
                >
                  <X size={8} />
                </button>
              )}
            </label>
            
            <textarea 
              className="flex-1 min-h-[5rem] bg-gray-50 border border-transparent focus:border-[#5CB338]/30 focus:ring-0 transition-all rounded-[1.5rem] p-4 text-xs font-semibold text-gray-700 outline-none placeholder:text-gray-400 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What environment impact did you make?"
            />
          </div>

          <div className="flex justify-between items-center bg-[#F7FBF4]/30 rounded-[1.5rem] p-4 border border-white">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Reward</span>
                <span className="text-xs font-black text-gray-900">+{calculatedPoints} XP</span>
              </div>
              <div className="w-px h-6 bg-white/50" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Offset</span>
                <span className="text-xs font-black text-[#5CB338]">{calculatedImpact} kg</span>
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selected || amount <= 0}
              className="flex items-center gap-2 bg-eco-dark text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-eco-dark/20 active:scale-95 transition-all disabled:opacity-40"
            >
              {isSubmitting ? "Syncing..." : <>Sync <Zap size={10} fill="currentColor" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
