import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DeckList from './components/DeckList';
import DeckView from './components/DeckView';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DeckList />} />
        <Route path="/deck/:name" element={<DeckView />} />
      </Routes>
    </Router>
  );
}

export default App;
