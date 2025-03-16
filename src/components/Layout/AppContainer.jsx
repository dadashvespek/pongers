import React, { useState } from 'react';
import Header from './Header';
import MatchScheduler from '../MatchScheduler/MatchScheduler';
import ScoreBoard from '../ScoreTracking/ScoreBoard';
import MatchHistory from '../ScoreTracking/MatchHistory';
import PlayerStats from '../ScoreTracking/PlayerStats';
import Leaderboard from '../ScoreTracking/Leaderboard';
import { useAppContext } from '../../context/AppContext';

const AppContainer = () => {
  const { sessionActive } = useAppContext();
  const [activeTab, setActiveTab] = useState('scheduler');
  
  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'scheduler' && <MatchScheduler />}
        {activeTab === 'stats' && <PlayerStats />}
        {activeTab === 'history' && <MatchHistory />}
        {activeTab === 'leaderboard' && <Leaderboard />}
      </main>
      
      {sessionActive && <ScoreBoard />}
    </div>
  );
};

export default AppContainer;