import React from 'react';
import { AppProvider } from './context/AppContext';
import AppContainer from './components/Layout/AppContainer';
import './App.css';

const App = () => {
  return (
    <AppProvider>
      <div className="app">
        <AppContainer />
      </div>
    </AppProvider>
  );
};

export default App;