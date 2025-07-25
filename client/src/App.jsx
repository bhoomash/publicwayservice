// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {

//   return (
//     <>
//       <h1 className="text-3xl font-bold">Welcome</h1>
//     </>
//   )
// }

// export default App

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Add protected routes here later */}
        <Route path="/dashboard" element={<div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>You are logged in!</p>
        </div>} />
      </Routes>
    </Router>
  );
}

export default App;
