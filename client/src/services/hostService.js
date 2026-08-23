import axios from 'axios';

export const getHostFleet = async (token) => {
  try {
    const response = await axios.get('/api/v1/vehicles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getHostBookings = async (token) => {
  try {
    const response = await axios.get('/api/v1/bookings/host', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createHostVehicle = async (vehicleData, token) => {
  try {
    const response = await axios.post('/api/v1/vehicles', vehicleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const extractRcDocumentInfo = async (fileData, token) => {
  try {
    const response = await axios.post('/api/v1/kyc/extract-id', fileData, {
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
