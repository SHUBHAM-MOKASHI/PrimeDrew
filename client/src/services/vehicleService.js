import axios from 'axios';

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? 'https://primedrew-api.onrender.com'
    : '');

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const API_BASE = `${API_BASE_URL}/api/v1/vehicles`;

export const getVehicles = async (params = {}) => {
  try {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getVehicleById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createVehicle = async (vehicleData, token) => {
  try {
    const response = await axios.post(API_BASE, vehicleData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateVehicle = async (id, vehicleData, token) => {
  try {
    const response = await axios.put(`${API_BASE}/${id}`, vehicleData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteVehicle = async (id, token) => {
  try {
    const response = await axios.delete(`${API_BASE}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
