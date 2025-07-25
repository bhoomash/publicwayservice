import React, { useState } from 'react';
import axios from '../utils/api';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', form);
      localStorage.setItem('token', res.data.token);
      alert("Login successful");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 border shadow rounded">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-green-600 text-white p-2 w-full rounded">Login</button>
      </form>
    </div>
  );
};

export default Login;
