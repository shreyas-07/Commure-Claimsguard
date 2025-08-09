// src/App.jsx

import React from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ClaimInput from './components/ClaimInput/ClaimInput';
import ClaimResults from './components/ClaimResults/ClaimResults';
import './App.css';

const App = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="left-column">
            <ClaimInput />
        </div>
        <div className="right-column">
          <div className="validated-claims-scroll custom-scrollbar">
            <h3 className="section-header">
              Processed Results
            </h3>
            <ClaimResults />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
