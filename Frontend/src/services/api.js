import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false
    });
  } else if (socket.auth?.token !== token) {
    // Update token if it's different (after login/logout)
    socket.auth.token = token;
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
  
  return socket;
};


// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const searchAPI = {
  search: async (query, useLangChain = false) => {
    const response = await api.post('/search', { query, useLangChain });
    return response.data;
  },
  
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/search/history?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getSearchById: async (id) => {
    const response = await api.get(`/search/${id}`);
    return response.data;
  }
};

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default api;
