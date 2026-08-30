import axios from 'axios';

/**
 * Universal Base URL resolution
 * Works seamlessly in Localhost, Vite dev proxy, and Vercel/Render production deployments.
 */
const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? 'https://primedrew-api.onrender.com'
    : '');

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('primedrew_token') ||
    localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
