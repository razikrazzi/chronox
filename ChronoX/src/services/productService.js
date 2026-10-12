import api from "./api";
import dbData from "../../db.json";

export const getProducts = async () => {
  try {
    const response = await api.get("/products");
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return dbData.products || [];
  } catch (error) {
    // If json-server is not running or network request fails, fall back gracefully to db.json
    console.warn("Backend API not reachable, loaded products from db.json:", error.message);
    return dbData.products || [];
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn("Backend API not reachable, looking up in db.json:", error.message);
  }

  const found = (dbData.products || []).find((p) => String(p.id) === String(id));
  return found || null;
};