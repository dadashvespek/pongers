import React from 'react';
import { useAppContext } from '../../context/AppContext';

const Header = ({ activeTab, setActiveTab }) => {
  const { sessionActive } = useAppContext();
  
  return (
    <header className="app-header">
      <h1>Ping Pong Scheduler</h1>
      
      <nav className="main-nav">
        <button 
          className={`nav-button ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          {sessionActive ? 'Current Session' : 'Start Session'}
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Player Stats
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Match History
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </nav>
    </header>
  );
};

export default Header;