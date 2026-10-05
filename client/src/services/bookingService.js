import axios from 'axios';

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://primedrew-api.onrender.com';

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const API_BASE = `${API_BASE_URL}/api/v1/bookings`;

const getAuthToken = (explicitToken) => {
  if (explicitToken) return explicitToken;
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('primedrew_token') ||
      ''
    );
  } catch {
    return '';
  }
};

const getHeaders = (token) => {
  const authToken = getAuthToken(token);
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };
};

const formatApiError = (error, fallbackMessage) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    (typeof error.response?.data === 'string' ? error.response.data : null) ||
    error.message ||
    fallbackMessage;
  const enhanced = new Error(message);
  enhanced.response = error.response;
  return enhanced;
};

export const createBooking = async (bookingData, token) => {
  try {
    const response = await axios.post(API_BASE, bookingData, {
      headers: getHeaders(token)
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to create booking.');
  }
};

export const getUserBookings = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/user`, {
      headers: getHeaders(token)
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to fetch user bookings.');
  }
};

export const getHostBookings = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/host`, {
      headers: getHeaders(token)
    });
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to fetch host bookings.');
  }
};

export const updateBookingStatus = async (id, status, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE}/${id}/status`,
      { status },
      {
        headers: getHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to update booking status.');
  }
};

export const generateHandoverOtp = async (id, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/${id}/generate-handover-otp`,
      {},
      {
        headers: getHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to generate handover OTP.');
  }
};

export const verifyHandoverOtp = async (id, otp, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/${id}/verify-handover-otp`,
      { otp },
      {
        headers: getHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to verify handover OTP.');
  }
};

export const completeTrip = async (id, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/${id}/complete-trip`,
      {},
      {
        headers: getHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to complete trip.');
  }
};

export const updateTripLocation = async (id, location, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE}/${id}/location`,
      location,
      {
        headers: getHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    throw formatApiError(error, 'Failed to update trip location.');
  }
};

export default {
  API_BASE_URL,
  createBooking,
  getUserBookings,
  getHostBookings,
  updateBookingStatus,
  generateHandoverOtp,
  verifyHandoverOtp,
  completeTrip,
  updateTripLocation
};
