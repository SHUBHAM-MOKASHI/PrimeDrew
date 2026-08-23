import axios from 'axios';

const API_BASE = '/api/v1/inspections';

export const detectVehicleDamage = async (formData, token) => {
  try {
    const headers = {
      'Content-Type': 'multipart/form-data'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(`${API_BASE}/detect-damage`, formData, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
