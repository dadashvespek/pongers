import React from 'react';
import { AppProvider } from './context/AppContext';
import AppContainer from './components/Layout/AppContainer';
import './App.css';

function App() {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}

export default App;