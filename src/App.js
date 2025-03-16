import React from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Layout/Header';
import AppContainer from './components/Layout/AppContainer';
import './App.css';

const App = () => {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <AppContainer />
      </div>
    </AppProvider>
  );
};

export default App;