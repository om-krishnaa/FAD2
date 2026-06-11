import axiosInstance from '../../utils/axios.util';

export const getPayments = async (token: string) => {
  try {
    const response = await axiosInstance.get(`/payment`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestPayment = async (
  token: string,
  payment_method: string,
  payment_identifier?: string
) => {
  try {
    const response = await axiosInstance.post(
      `/payment`,
      { payment_method, payment_identifier },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePayment = async (
  id: string,
  token: string,
  body: {
    id: number;
    type?: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    status?: string;
    description?: string;
    failure_reason?: string;
  }
) => {
  try {
    const response = await axiosInstance.patch(`/payment/` + id, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
