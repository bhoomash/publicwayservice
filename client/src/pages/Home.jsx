// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center mt-10">
      <h1 className="text-4xl font-bold mb-4">Welcome to e-Sampark  Portal</h1>
      <p className="text-gray-600 mb-6">Register your complaints and track them easily</p>
      <div className="space-x-4">
        <Link to="/login" className="bg-green-600 text-white px-4 py-2 rounded">Login</Link>
        <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded">Register</Link>
      </div>
    </div>
  );
};

export default Home;
