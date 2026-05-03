import React, { useEffect, useState } from 'react';
import { Trophy, ChevronLeft, Users, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Screen } from '../types';

interface UserLeaderboard {
  uid: string;
  displayName: string;
  points: number;
  photoURL?: string;
  rank?: number;
}

interface LeaderboardProps {
  setScreen?: (screen: Screen) => void;
}

export default function Leaderboard({ setScreen }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<UserLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeaders = snapshot.docs.map((doc, index) => ({
        ...(doc.data() as UserLeaderboard),
        rank: index + 1
      }));
      setLeaders(fetchedLeaders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const topThree = leaders.slice(0, 3);
  const others = leaders.slice(3);

  return (
    <div className="flex-1 bg-[#F7FBF4] min-h-screen px-5 pt-10 pb-32 max-w-lg mx-auto space-y-8 font-sans overflow-y-auto">
      {/* Header */}
      <header className="flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen?.('dashboard')}
            className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <h1 className="text-xl font-black text-gray-900 leading-none">Top <span className="text-[#5CB338]">Warriors</span></h1>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
          <Trophy size={18} className="text-amber-500" />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[250px]">
          <Loader2 className="w-8 h-8 text-[#5CB338] animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] space-y-3">
          <Users size={40} className="text-gray-200" />
          <p className="text-xs text-gray-400 font-bold">No warriors active yet</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 pt-8 pb-4">
            {/* Rank 2 */}
            {topThree[1] && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="relative">
                  {topThree[1].photoURL ? (
                    <img src={topThree[1].photoURL} className="w-16 h-16 rounded-[1.5rem] border-[3px] border-white shadow-md object-cover" alt="2nd" />
                  ) : (
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 flex items-center justify-center border-[3px] border-white shadow-md">
                      <span className="text-lg font-black text-gray-300">2</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center border border-[#F7FBF4] text-[8px] font-black text-white">2</div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-gray-900 truncate max-w-[60px]">{topThree[1].displayName?.split(' ')[0]}</p>
                  <p className="text-[9px] font-black text-[#5CB338] uppercase tracking-wider">{topThree[1].points.toLocaleString()} XP</p>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {topThree[0] && (
              <div className="flex-[1.2] flex flex-col items-center gap-2 -translate-y-4">
                <Trophy size={24} className="text-amber-500 mb-1 bounce-in" />
                <div className="relative shadow-2xl shadow-amber-500/10">
                  {topThree[0].photoURL ? (
                    <img src={topThree[0].photoURL} className="w-24 h-24 rounded-[2rem] border-[4px] border-amber-500 shadow-md object-cover" alt="1st" />
                  ) : (
                    <div className="w-24 h-24 rounded-[2rem] bg-amber-50 flex items-center justify-center border-[4px] border-amber-500 shadow-md">
                      <span className="text-2xl font-black text-amber-500">1</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-500 px-2 py-0.5 rounded-lg border border-[#F7FBF4] text-[7px] font-black text-white tracking-widest leading-none truncate whitespace-nowrap">MVP</div>
                </div>
                <div className="text-center pt-1">
                  <p className="text-sm font-black text-gray-900 truncate max-w-[100px]">{topThree[0].displayName?.split(' ')[0]}</p>
                  <p className="text-[10px] font-black text-[#5CB338] uppercase tracking-wider">{topThree[0].points.toLocaleString()} XP</p>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="relative">
                  {topThree[2].photoURL ? (
                    <img src={topThree[2].photoURL} className="w-14 h-14 rounded-[1.25rem] border-[3px] border-white shadow-md object-cover" alt="3rd" />
                  ) : (
                    <div className="w-14 h-14 rounded-[1.25rem] bg-gray-100 flex items-center justify-center border-[3px] border-white shadow-md">
                      <span className="text-base font-black text-gray-300">3</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center border border-[#F7FBF4] text-[8px] font-black text-white">3</div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-gray-900 truncate max-w-[60px]">{topThree[2].displayName?.split(' ')[0]}</p>
                  <p className="text-[9px] font-black text-[#5CB338] uppercase tracking-wider">{topThree[2].points.toLocaleString()} XP</p>
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Rising Stars</h3>
            <div className="space-y-2.5">
              {others.map((leader) => (
                <div key={leader.uid} className="bg-white p-3.5 rounded-[1.75rem] flex items-center justify-between border border-gray-50 shadow-sm active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-gray-300">#{leader.rank}</span>
                    <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
                      {leader.photoURL ? (
                        <img src={leader.photoURL} className="w-full h-full object-cover" alt={leader.displayName} />
                      ) : (
                        <span className="text-[10px] font-black text-gray-300">{leader.displayName?.[0] || 'W'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-gray-700 leading-none truncate">{leader.displayName || 'Warrior'}</p>
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1">Impact Level</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900 leading-none">{leader.points.toLocaleString()}</p>
                    <p className="text-[8px] font-black text-[#5CB338] mt-1">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
