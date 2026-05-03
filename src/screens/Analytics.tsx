import React, { useEffect, useState } from 'react';
import { TrendingUp, Leaf, Zap, ChevronLeft, Calendar, Car, Trees, Award, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { UserStats, Screen } from '../types';

interface AnalyticsProps {
  stats: UserStats;
  setScreen?: (screen: Screen) => void;
}

export default function Analytics({ stats, setScreen }: AnalyticsProps) {
  const [chartData, setChartData] = useState<{ day: string; value: number }[]>([]);
  const [activeMetric, setActiveMetric] = useState<'co2' | 'points'>('co2');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function setupAnalytics() {
      if (!auth.currentUser) return;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const q = query(
        collection(db, `users/${auth.currentUser.uid}/activities`),
        where('timestamp', '>=', sevenDaysAgo),
        orderBy('timestamp', 'asc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const dataMap: Record<string, { co2: number; points: number }> = {};
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const label = d.toLocaleDateString('en-US', { weekday: 'short' });
          dataMap[label] = { co2: 0, points: 0 };
        }

        snapshot.forEach(doc => {
          const data = doc.data();
          const date = data.timestamp?.toDate();
          if (date) {
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            if (dataMap[label] !== undefined) {
              dataMap[label].co2 += (data.impact || 0);
              dataMap[label].points += (data.points || 0);
            }
          }
        });

        const formatted = Object.entries(dataMap).map(([day, values]) => ({ 
          day, 
          value: activeMetric === 'co2' ? Number(values.co2.toFixed(1)) : values.points
        }));
        setChartData(formatted);
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${auth.currentUser?.uid}/activities`);
        setLoading(false);
      });
    }

    setupAnalytics();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [activeMetric]);

  const pieData = [
    { name: 'Transport', value: Math.max(1, Math.floor(stats.co2Saved * 10)), color: '#5CB338' },
    { name: 'Energy', value: Math.max(1, Math.floor(stats.energy * 10)), color: '#2F5233' },
    { name: 'Recycle', value: Math.max(1, Math.floor(stats.points * 0.1)), color: '#76B947' },
  ].filter(d => d.value > 0);

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
          <h1 className="text-xl font-black text-gray-900 leading-none">Impact <span className="text-[#5CB338]">Story</span></h1>
        </div>
        <button className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Calendar size={18} className="text-[#5CB338]" />
        </button>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Leaf size={20} className="text-[#5CB338]" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Net Offset</p>
            <p className="text-xl font-black text-gray-900 leading-none">
              {stats.co2Saved.toFixed(1)} <span className="text-[10px] text-gray-400">KG</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Total Impact</p>
            <p className="text-xl font-black text-gray-900 leading-none">
              {stats.points.toLocaleString()} <span className="text-[10px] text-gray-400">XP</span>
            </p>
          </div>
        </div>
      </div>

      {/* Impact Translation */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h3 className="text-base font-black text-gray-900 italic uppercase">Impact Translation</h3>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Physical manifest of your effort</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <Trees size={28} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900 leading-none">{Math.max(0, Math.floor(stats.co2Saved / 22))}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Trees</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-amber-50 rounded-[1.25rem] flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <Car size={28} className="text-amber-600" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-900 leading-none">{Math.max(0, Math.floor(stats.co2Saved * 5.8))}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Miles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-gray-900">Performance</h3>
            <div className="inline-flex bg-gray-50 p-1 rounded-2xl gap-1">
              {(['co2', 'points'] as const).map(m => (
                <button 
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    activeMetric === m ? 'bg-[#5CB338] text-white shadow-md shadow-[#5CB338]/20' : 'text-gray-400'
                  }`}
                >
                  {m === 'co2' ? 'CO2' : 'XP'}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Timeframe</p>
            <p className="text-xs font-black text-gray-400 mt-1">Last 7 Days</p>
          </div>
        </div>

        <div className="h-[250px] w-full flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-8 h-8 text-[#5CB338] animate-spin" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontWeight: 900, fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontFamily: 'sans-serif',
                    fontWeight: 900
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={activeMetric === 'co2' ? '#5CB338' : '#3B82F6'} 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: activeMetric === 'co2' ? '#5CB338' : '#3B82F6', strokeWidth: 0 }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <p className="text-gray-300 font-bold">Start taking action to see trends</p>
          )}
        </div>
      </div>

      {/* Contribution Mix */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-50 shadow-sm space-y-10">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900">Contribution Mix</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Where your impact comes from</p>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mission Progress */}
      <div className="space-y-6">
        <div className="px-2">
          <h3 className="text-xl font-black text-gray-900">Mission Progress</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Your sustainability journey</p>
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Eco Sprout', target: 50, current: stats.points, icon: Leaf, color: '#10B981', bgColor: 'bg-emerald-50' },
            { label: 'Carbon Crusher', target: 10, current: stats.co2Saved, icon: Zap, color: '#F59E0B', bgColor: 'bg-amber-50' },
            { label: 'Earth Guardian', target: 500, current: stats.points, icon: Award, color: '#8B5CF6', bgColor: 'bg-violet-50' },
          ].map((m) => (
            <div key={m.label} className="bg-white p-6 rounded-[2.5rem] flex items-center gap-6 border border-gray-50 shadow-sm">
              <div className={`w-14 h-14 ${m.bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
                <m.icon size={24} style={{ color: m.color }} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-base font-black text-gray-900 leading-none">{m.label}</p>
                  <p className="text-[10px] font-black text-gray-400">
                    {Math.min(100, Math.floor((m.current / m.target) * 100))}%
                  </p>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      backgroundColor: m.color, 
                      width: `${Math.min(100, (m.current / m.target) * 100)}%` 
                    }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
