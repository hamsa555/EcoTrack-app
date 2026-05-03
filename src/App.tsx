import React, { useState } from 'react';
import { Leaf, RefreshCcw } from 'lucide-react';
import { Screen } from './types';
import BottomNav from './components/BottomNav';
import { FirebaseProvider, useFirebase } from './lib/FirebaseContext';
import { UserStats } from './types';

// Screens
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Analytics from './screens/Analytics';
import MapScreen from './screens/Map';
import Scanner from './screens/Scanner';
import Leaderboard from './screens/Leaderboard';
import Profile from './screens/Profile';
import AIChatbot from './components/AIChatbot';
import ActivityInput from './screens/ActivityInput';

function AppContent() {
  const { user, userStats, loading } = useFirebase();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  const defaultStats: UserStats = { score: 0, co2Saved: 0, steps: 0, energy: 0, points: 0 };

  React.useEffect(() => {
    if (user && !loading && currentScreen === 'login') {
      setCurrentScreen('dashboard');
    } else if (!user && !loading && currentScreen !== 'login') {
      setCurrentScreen('login');
    }
  }, [user, loading]);

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7FBF4]">
          <div className="w-16 h-16 bg-[#5CB338] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5CB338]/20 animate-pulse">
            <Leaf size={32} className="text-white" />
          </div>
          <p className="mt-6 text-[10px] font-black color-[#9CA3AF] uppercase tracking-[0.3em]">Nurturing your world...</p>
        </div>
      );
    }

    switch (currentScreen) {
      case 'login': return <Login />;
      case 'dashboard': return <Dashboard stats={userStats || defaultStats} setScreen={setCurrentScreen} />;
      case 'activity': return <ActivityInput setScreen={setCurrentScreen} />;
      case 'analytics': return <Analytics stats={userStats || defaultStats} setScreen={setCurrentScreen} />;
      case 'map': return <MapScreen setScreen={setCurrentScreen} />;
      case 'scanner': return <Scanner setScreen={setCurrentScreen} />;
      case 'leaderboard': return <Leaderboard setScreen={setCurrentScreen} />;
      case 'profile': return <Profile stats={userStats || defaultStats} setScreen={setCurrentScreen} />;
      default: return <Dashboard stats={userStats || defaultStats} setScreen={setCurrentScreen} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FBF4] text-gray-900 font-sans">
      <main className="flex-1 w-full overflow-y-auto pb-24">
        {renderScreen()}
      </main>
      {user && <BottomNav activeScreen={currentScreen} setScreen={setCurrentScreen} />}
      {user && <AIChatbot />}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
