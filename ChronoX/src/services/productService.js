import api from "./api";
import fallbackProducts from "../data/fallbackProducts";

export const getProducts = async () => {
  try {
    const response = await api.get("/products");
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return fallbackProducts;
  } catch (error) {
    // If json-server is not running or network request fails, fall back gracefully to static products
    console.warn("Backend API not reachable, loaded products from fallback data:", error.message);
    return fallbackProducts;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn("Backend API not reachable, looking up in fallback data:", error.message);
  }

  const found = fallbackProducts.find((p) => String(p.id) === String(id));
  return found || null;
};