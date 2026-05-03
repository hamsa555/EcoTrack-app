
export type Screen = 'login' | 'dashboard' | 'activity' | 'analytics' | 'map' | 'scanner' | 'leaderboard' | 'profile' | 'post';

export interface UserStats {
  score: number;
  co2Saved: number; // in kg
  steps: number;
  energy: number; // in kWh
  points: number;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'car' | 'bus' | 'walk' | 'meal';
  timestamp: string;
  impact: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}
