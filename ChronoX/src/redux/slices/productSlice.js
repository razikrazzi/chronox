import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getProducts } from "../../services/productService";

// ========================================
// FETCH PRODUCTS
// ========================================

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",

  async (_, { rejectWithValue }) => {
    try {
      const data = await getProducts();

      console.log("Products received from API:", data);

      return data;
    } catch (error) {
      console.error("Fetch products error:", error);

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch products",
      );
    }
  },
);

// ========================================
// INITIAL STATE
// ========================================

const initialState = {
  products: [],
  loading: false,
  error: null,
};

// ========================================
// PRODUCT SLICE
// ========================================

const productSlice = createSlice({
  name: "products",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // ========================================
      // REQUEST STARTED
      // ========================================

      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // ========================================
      // REQUEST SUCCESS
      // ========================================

      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        state.products = action.payload;
      })

      // ========================================
      // REQUEST FAILED
      // ========================================

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload || "Failed to fetch products";

        state.products = [];
      });
  },
});

export default productSlice.reducer;