import api from "./api";

const unwrapData = (response) => response?.data?.data ?? response?.data;

export const fetchInventory = async () => {
  const response = await api.get("/api/inventory");
  return unwrapData(response);
};

// Batch update: payload = { updates: [{ productId, addQuantity|setQuantity, note? }] }
export const updateInventory = async (payload) => {
  const response = await api.post("/api/inventory", payload);
  return unwrapData(response);
};
