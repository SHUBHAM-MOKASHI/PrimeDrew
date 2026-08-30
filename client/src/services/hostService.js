import axios from 'axios';

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? 'https://primedrew-api.onrender.com'
    : '');

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const applyForHost = async (formData, token) => {
  const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/hosts/apply`,
      formData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : ''
        }
      }
    );
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      const fallbackRes = await axios.post(
        `${API_BASE_URL}/api/v1/users/apply-host`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authToken ? `Bearer ${authToken}` : ''
          }
        }
      );
      return fallbackRes.data;
    }
    throw err.response?.data || err;
  }
};

export const getHostFleet = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/vehicles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getHostBookings = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/bookings/host`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createHostVehicle = async (vehicleData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/vehicles`, vehicleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const extractRcDocumentInfo = async (fileData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/kyc/extract-id`, fileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default {
  applyForHost,
  getHostFleet,
  getHostBookings,
  createHostVehicle,
  extractRcDocumentInfo
};
