import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000', // adjust if backend is on different port
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
