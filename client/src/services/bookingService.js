import axios from 'axios';

const API_BASE = '/api/v1/bookings';

export const createBooking = async (bookingData, token) => {
  try {
    const response = await axios.post(API_BASE, bookingData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserBookings = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getHostBookings = async (token) => {
  try {
    const response = await axios.get(`${API_BASE}/host`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateBookingStatus = async (id, status, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE}/${id}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
