import React, { useEffect, useState } from 'react';
import { RefreshCw, Bike, Bell, TrendingUp, Calendar, Zap, PieChart, Trophy, Leaf } from 'lucide-react';
import { Screen, UserStats } from '../types';
import { useFirebase } from '../lib/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import AIAdvice from '../components/AIAdvice';
import NotificationCenter from '../components/NotificationCenter';
import QuickLog from '../components/QuickLog';
import { notificationService } from '../services/notificationService';

interface DashboardProps {
  stats: UserStats;
  setScreen: (screen: Screen) => void;
}

interface Activity {
  id: string;
  type: string;
  points: number;
  timestamp: any;
  impact: number;
  imageUrl?: string;
  comment?: string;
}

export default function Dashboard({ stats, setScreen }: DashboardProps) {
  const { user } = useFirebase();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const percentage = stats.score % 100;
  const nextLevelXp = 100 - (stats.score % 100);

  useEffect(() => {
    return notificationService.subscribe((notifs) => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, `users/${user.uid}/activities`),
      orderBy('timestamp', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setRecentActivities(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/activities`);
    });

    return unsubscribe;
  }, [user]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (percentage / 100));

  return (
    <div className="flex-1 bg-[#F8FAF6] min-h-screen">
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      
      <div className="px-5 pt-3 pb-32 max-w-lg mx-auto space-y-5">
        {/* Dynamic Header */}
        <header className="flex justify-between items-center sticky top-0 bg-[#F8FAF6]/80 backdrop-blur-md py-3 z-10 -mx-5 px-5">
          <button 
            onClick={() => setScreen('profile')}
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover" 
                  alt="Avatar"
                />
              ) : (
                <div className="w-11 h-11 bg-[#5CB338]/10 rounded-2xl border-2 border-white flex items-center justify-center text-[#5CB338] font-bold text-lg">
                  {user?.displayName?.[0] || 'E'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#5CB338] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                {Math.floor(stats.score / 100) + 1}
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-base font-black text-gray-900 leading-none">{user?.displayName?.split(' ')[0] || 'Warrior'}</h1>
              <p className="text-[10px] font-black text-[#5CB338] uppercase tracking-wider mt-1">Eco Tracker</p>
            </div>
          </button>

          <button 
            onClick={() => setIsNotifOpen(true)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm relative active:scale-90 transition-transform"
          >
            <Bell size={18} className="text-gray-400" />
            {unreadCount > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
          </button>
        </header>

        <section className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-[#5CB338] to-[#2F5233] rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[280px] shadow-xl shadow-[#5CB338]/20 relative overflow-hidden">
            <div className="relative flex items-center justify-center">
              <svg width="150" height="150" className="-rotate-90">
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/15"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  stroke="white"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 65}
                  style={{ strokeDashoffset: (2 * Math.PI * 65) - (2 * Math.PI * 65 * (percentage / 100)) }}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-white text-4xl font-black leading-none">{stats.score}</span>
                <span className="text-white/70 text-[9px] font-black uppercase tracking-widest mt-1">Impact Points</span>
              </div>
            </div>

            <div className="flex w-full mt-6 pt-5 border-t border-white/10">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-white text-xs font-black">{stats.co2Saved.toFixed(1)}kg</span>
                <span className="text-white/60 text-[7px] font-black uppercase tracking-widest mt-1">CO2 Saved</span>
              </div>
              <div className="flex-1 flex flex-col items-center border-x border-white/10">
                <span className="text-[#6EE7B7] text-xs font-black">{stats.steps.toLocaleString()}</span>
                <span className="text-white/60 text-[7px] font-black uppercase tracking-widest mt-1">Steps</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-white text-xs font-black">{stats.energy.toFixed(1)}k</span>
                <span className="text-white/60 text-[7px] font-black uppercase tracking-widest mt-1">Energy</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5CB338]/10 rounded-xl flex items-center justify-center text-[#5CB338] shrink-0">
                <TrendingUp size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none truncate">Tier</p>
                <p className="text-sm font-black text-gray-900 mt-1">Lvl {Math.floor(stats.score / 100) + 1}</p>
              </div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 shrink-0">
                <Zap size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none truncate">Coins</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stats.points.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex gap-4">
          <button 
            onClick={() => setScreen('analytics')}
            className="flex-1 bg-white rounded-[2rem] p-4 flex items-center gap-4 border border-gray-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <PieChart size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Impact</p>
              <p className="text-xs font-black text-gray-900 mt-1">Analytics</p>
            </div>
          </button>

          <button 
            onClick={() => setScreen('leaderboard')}
            className="flex-1 bg-white rounded-[2rem] p-4 flex items-center gap-4 border border-gray-100 shadow-sm active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Trophy size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Rank</p>
              <p className="text-xs font-black text-gray-900 mt-1">Leaderboard</p>
            </div>
          </button>
        </section>

        <QuickLog />

        <section className="space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Eco Tracker Level</h4>
              <span className="text-[10px] font-black text-[#5CB338] italic">Lvl {Math.floor(stats.score / 100) + 1}</span>
            </div>
            <div className="h-3 bg-[#F8FAF6] rounded-full overflow-hidden border border-white">
              <div 
                className="h-full bg-[#5CB338] rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[9px] text-gray-400 font-bold lowercase">{nextLevelXp} xp to next milestone</p>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Daily Mission</h4>
              <span className="text-[10px] font-black text-amber-500 italic">50 XP Goal</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[#F8FAF6] rounded-full overflow-hidden border border-white">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (stats.score / 50) * 100)}%` }}
                />
              </div>
              <Zap size={14} className={stats.score >= 50 ? "text-amber-500" : "text-gray-200"} fill={stats.score >= 50 ? "currentColor" : "none"} />
            </div>
          </div>
        </section>

        <AIAdvice />

        <section className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-xl font-bold text-gray-900">Mission Feed</h3>
            <button 
              onClick={() => setScreen('analytics')}
              className="px-4 py-2 bg-white rounded-xl border border-gray-50 shadow-sm text-[10px] font-black text-[#5CB338] uppercase tracking-wider active:scale-95 transition-transform"
            >
              Insights
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F8FAF6] rounded-full flex items-center justify-center mb-4">
                <Calendar size={32} className="text-[#5CB338]/20" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Fresh Start</h4>
              <p className="text-xs text-gray-400 mt-2 text-center max-w-[180px]">Your environmental contribution will appear here once logged.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#F8FAF6] rounded-[1.75rem] border-2 border-white overflow-hidden shadow-sm">
                        {act.imageUrl ? (
                          <img src={act.imageUrl} className="w-full h-full object-cover" alt="Pulse" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#5CB338]">
                            <Zap size={24} />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-black text-gray-900 italic tracking-tight leading-none mb-1">{act.type}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${act.impact >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {act.impact > 0 ? `+${act.impact}` : act.impact}kg CO2
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {act.timestamp?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(act.timestamp.toDate()) : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#5CB338] px-4 py-2 rounded-2xl shadow-lg shadow-[#5CB338]/20">
                      <span className="text-white text-xs font-black">+{act.points} XP</span>
                    </div>
                  </div>
                  {act.comment && (
                    <div className="bg-[#F9FAFB] p-4 rounded-2xl mt-4 border border-gray-100">
                      <p className="text-xs text-gray-600 font-bold italic translate-y-0.5">"{act.comment}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
