import React, { useState } from 'react';
import axios from '../utils/api';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post('/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      alert("Registration successful!");
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      alert("Registration failed");
    }
  };

  const handleGoogleSignIn = () => {
    alert("Google Sign-In (via Firebase) will be implemented here.");
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 border shadow rounded space-y-6">
      <h2 className="text-2xl font-bold mb-2 text-center">Register</h2>

      {/* Google Sign-In */}
      <button
        onClick={handleGoogleSignIn}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
      >
        Continue with Google
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      {/* JWT + MongoDB Registration */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">Register</button>
      </form>
    </div>
  );
};

export default Register;
