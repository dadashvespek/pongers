import React from 'react';
import PlayerSelection from './PlayerSelection';
import CurrentMatch from './CurrentMatch';
import UpcomingMatches from './UpcomingMatches';
import { useAppContext } from '../../context/AppContext';

const MatchScheduler = () => {
  const { 
    selectedPlayers, 
    sessionActive, 
    startSession,
    endSession
  } = useAppContext();
  
  return (
    <div className="match-scheduler">
      {!sessionActive ? (
        <div className="session-setup">
          <h2>Set Up New Session</h2>
          <PlayerSelection />
          
          <div className="actions">
            <button 
              className="primary-button"
              onClick={startSession}
              disabled={selectedPlayers.length < 2}
            >
              Generate Match Rotation
            </button>
          </div>
        </div>
      ) : (
        <div className="active-session">
          <div className="session-header">
            <h2>Current Session</h2>
            <button className="secondary-button" onClick={endSession}>
              End Session
            </button>
          </div>
          
          <CurrentMatch />
          <UpcomingMatches />
        </div>
      )}
    </div>
  );
};

export default MatchScheduler;