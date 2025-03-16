// src/components/Layout/Header.jsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';

const Header = ({ activeTab, setActiveTab }) => {
  const { sessionActive } = useAppContext();
  
  const handleTabClick = (tab) => {
    if (sessionActive && tab !== 'scheduler') {
      alert('A match is in progress! Complete the current session first.');
      return;
    }
    
    setActiveTab(tab);
  };
  
  return (
    <header className="app-header">
      <h1>Ping Pong Scheduler</h1>
      
      <nav className="main-nav">
        <button 
          className={`nav-button ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => handleTabClick('scheduler')}
        >
          {sessionActive ? 'Current Match' : 'Start Session'}
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => handleTabClick('players')}
          disabled={sessionActive}
        >
          Players
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => handleTabClick('stats')}
          disabled={sessionActive}
        >
          Player Stats
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabClick('history')}
          disabled={sessionActive}
        >
          Match History
        </button>
        
        <button 
          className={`nav-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('leaderboard')}
          disabled={sessionActive}
        >
          Leaderboard
        </button>
      </nav>
    </header>
  );
};

export default Header;