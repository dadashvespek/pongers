import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import MatchHistory from './MatchHistory';
import PlayerStats from './PlayerStats';
import Leaderboard from './Leaderboard';

const ScoreBoard = () => {
  const { setViewMode, viewMode } = useAppContext();
  const [activeTab, setActiveTab] = useState('history');
  
  return (
    <div className="score-board section">
      <h2 className="section-title">Stats & History</h2>
      
      <div className="view-mode-selector">
        <button 
          className={`btn ${viewMode === 'current' ? 'btn-secondary' : ''}`}
          onClick={() => setViewMode('current')}
        >
          Current Session
        </button>
        <button 
          className={`btn ${viewMode === 'allTime' ? 'btn-secondary' : ''}`}
          onClick={() => setViewMode('allTime')}
        >
          All Time
        </button>
      </div>
      
      <div className="stats-tabs">
        <div 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Match History
        </div>
        <div 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Player Stats
        </div>
        <div 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </div>
      </div>
      
      {activeTab === 'history' && <MatchHistory />}
      {activeTab === 'stats' && <PlayerStats />}
      {activeTab === 'leaderboard' && <Leaderboard />}
    </div>
  );
};

export default ScoreBoard;