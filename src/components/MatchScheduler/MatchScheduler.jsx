import React from 'react';
import { useAppContext } from '../../context/AppContext';
import PlayerSelection from './PlayerSelection';
import CurrentMatch from './CurrentMatch';
import UpcomingMatches from './UpcomingMatches';

const MatchScheduler = () => {
  const { activeSession, generateMatchSchedule, endSession } = useAppContext();

  return (
    <div className="match-scheduler section">
      {!activeSession ? (
        <>
          <h2 className="section-title">Start a New Session</h2>
          <PlayerSelection />
          <div className="action-buttons">
            <button 
              className="btn" 
              onClick={generateMatchSchedule}
            >
              Generate Rotation
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="section-header">
            <h2 className="section-title">Current Session</h2>
            <button 
              className="btn btn-danger" 
              onClick={endSession}
            >
              End Session
            </button>
          </div>
          <CurrentMatch />
          <UpcomingMatches />
        </>
      )}
    </div>
  );
};

export default MatchScheduler;