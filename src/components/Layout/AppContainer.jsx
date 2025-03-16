import React, { useState } from 'react';
import MatchScheduler from '../MatchScheduler/MatchScheduler';
import ScoreBoard from '../ScoreTracking/ScoreBoard';

const AppContainer = () => {
  const [activeTab, setActiveTab] = useState('scheduler');

  return (
    <div className="app-container">
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          Match Scheduler
        </div>
        <div 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats & History
        </div>
      </div>

      {activeTab === 'scheduler' ? (
        <MatchScheduler />
      ) : (
        <ScoreBoard />
      )}
    </div>
  );
};

export default AppContainer;