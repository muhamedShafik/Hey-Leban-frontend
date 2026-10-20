import api from "./api";

export const changePassword = async (payload) => {
  const response = await api.post("/api/profile/password/change", payload);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post("/api/auth/reset", { email });
  return response.data;
};

export const validateResetToken = async (token) => {
  const response = await api.get(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post("/api/auth/reset-password", {
    token,
    newPassword,
  });
  return response.data;
};