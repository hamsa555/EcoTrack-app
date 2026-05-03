import React from 'react';
import { Settings, ChevronLeft, ShieldCheck, Bike, Battery, Star, Zap, Share2, LogOut, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserStats, Screen } from '../types';
import { useFirebase } from '../lib/FirebaseContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

interface ProfileProps {
  stats: UserStats;
  setScreen: (screen: Screen) => void;
}

export default function Profile({ stats, setScreen }: ProfileProps) {
  const { user } = useFirebase();
  const [showConfirmReset, setShowConfirmReset] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const badges = [
    { id: 'hero', icon: ShieldCheck, label: 'Eco Tracker', color: '#10B981', bgColor: '#ECFDF5', active: stats.points > 100 },
    { id: 'cyclist', icon: Bike, label: 'Cyclist', color: '#F97316', bgColor: '#FFF7ED', active: stats.co2Saved > 5 },
    { id: 'saver', icon: Battery, label: 'Energy Saver', color: '#3B82F6', bgColor: '#EFF6FF', active: stats.energy > 0 },
    { id: 'explorer', icon: Star, label: 'Eco Explorer', color: '#8B5CF6', bgColor: '#F5F3FF', active: stats.score > 500 },
    { id: 'master', icon: Zap, label: 'Waste Master', color: '#EAB308', bgColor: '#FEFCE8', active: stats.points > 1000 },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: 0,
        score: 0,
        co2Saved: 0,
        steps: 0,
        energy: 0,
        updatedAt: serverTimestamp()
      });

      const activitiesRef = collection(db, `users/${user.uid}/activities`);
      const snapshot = await getDocs(activitiesRef);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      notificationService.send("Profile Reset", "Environmental impact data has been purged.", "impact");
      setShowConfirmReset(false);
    } catch (error) {
      console.error("Reset failed", error);
      notificationService.send("Reset Failed", "Internal memory breach. Try again.", "impact");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F7FBF4] min-h-screen px-5 pt-10 pb-32 max-w-lg mx-auto space-y-8 font-sans overflow-y-auto">
      {/* Header */}
      <header className="flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen('dashboard')}
            className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <h1 className="text-xl font-black text-gray-900 leading-none">Warrior <span className="text-[#5CB338]">Profile</span></h1>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm active:scale-90 transition-transform"
        >
          <LogOut size={18} className="text-red-500" />
        </button>
      </header>

      {/* Profile Info */}
      <section className="flex flex-col items-center">
        <div className="relative mb-5">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-lg object-cover" 
              alt="Avatar"
            />
          ) : (
            <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-4xl font-black text-gray-200">{user?.displayName?.[0] || 'W'}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-[#5CB338] p-2 rounded-xl border-[3px] border-white shadow-xl">
            <ShieldCheck size={18} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 whitespace-nowrap">{user?.displayName || 'Eco Warrior'}</h2>
          <p className="text-[9px] font-black text-[#5CB338] uppercase tracking-[0.2em] mt-1">Lvl {Math.floor(stats.score / 100) + 1} Defender</p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-gray-700 uppercase tracking-widest leading-none">Total Impact</span>
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
            <Zap size={16} fill="currentColor" />
          </div>
        </div>
        
        <div className="flex justify-between items-end gap-2">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CO2 Offset</p>
            <p className="text-3xl font-black text-gray-900 leading-none truncate">
              {stats.co2Saved.toFixed(1)}
              <span className="text-[9px] text-[#5CB338] ml-1 uppercase">KG</span>
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Impact XP</p>
            <p className="text-3xl font-black text-gray-900 leading-none truncate">{stats.points.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Achievements</h3>
          <span className="text-[9px] font-black text-[#5CB338] uppercase tracking-widest">
            {badges.filter(b => b.active).length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${
                badge.active ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-30 grayscale'
              }`}
            >
              <div 
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: badge.active ? badge.bgColor : 'transparent' }}
              >
                <badge.icon size={16} style={{ color: badge.active ? badge.color : "#9CA3AF" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-3">
        {!showConfirmReset ? (
          <button 
            onClick={() => setShowConfirmReset(true)}
            className="w-full py-4 bg-white rounded-2xl flex items-center justify-center gap-3 border border-red-100 text-red-500 active:scale-[0.98] transition-all hover:bg-red-50"
          >
            <Trash2 size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Purge Data</span>
          </button>
        ) : (
          <div className="bg-red-600 rounded-[2rem] p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] truncate">Nuclear Reset</h4>
                <p className="text-[9px] font-black text-white/80 uppercase">Irreversible action</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Abort
              </button>
              <button 
                onClick={handleReset}
                disabled={isResetting}
                className="flex-[2] py-3 bg-white rounded-xl text-red-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                {isResetting ? (
                  <RefreshCw size={12} className="animate-spin" /> 
                ) : (
                  "Confirm Purge"
                )}
              </button>
            </div>
          </div>
        )}

        <button className="w-full py-4 bg-[#2F5233] rounded-2xl flex items-center justify-center gap-3 text-white shadow-xl shadow-[#2F5233]/20 active:scale-[0.98] transition-all">
          <Settings size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Settings</span>
        </button>
        
        <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] pt-1">Eco Warrior v2.0</p>
      </section>
    </div>
  );
}
