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

  {
    condition: (arg, { getState }) => {
      const { products } = getState();

      // If force was explicitly requested (e.g. admin update or manual retry), allow fetch
      if (arg === true || (typeof arg === "object" && arg?.force)) {
        return true;
      }

      // If already loading, prevent duplicate concurrent requests
      if (products.status === "loading") {
        return false;
      }

      // If already successfully loaded, preserve Redux products and skip redundant network call
      if (products.status === "succeeded") {
        return false;
      }

      return true;
    },
  },
);

// ========================================
// INITIAL STATE
// ========================================

const initialState = {
  products: [],
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  loading: false,
  error: null,
};

// ========================================
// PRODUCT SLICE
// ========================================

const productSlice = createSlice({
  name: "products",

  initialState,

  reducers: {
    invalidateProducts: (state) => {
      state.status = "idle";
    },

    productAdded: (state, action) => {
      if (action.payload?.id != null) {
        state.products.push(action.payload);
        state.status = "succeeded";
      }
    },

    productUpdated: (state, action) => {
      const index = state.products.findIndex(
        (p) => String(p.id) === String(action.payload?.id),
      );
      if (index !== -1) {
        state.products[index] = {
          ...state.products[index],
          ...action.payload,
        };
        state.status = "succeeded";
      }
    },

    productDeleted: (state, action) => {
      const targetId = String(action.payload);
      state.products = state.products.filter(
        (p) => String(p.id) !== targetId,
      );
      state.status = "succeeded";
    },
  },

  extraReducers: (builder) => {
    builder
      // ========================================
      // REQUEST STARTED
      // ========================================
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })

      // ========================================
      // REQUEST SUCCESS
      // ========================================
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.products = Array.isArray(action.payload)
          ? action.payload
          : [];
      })

      // ========================================
      // REQUEST FAILED
      // ========================================
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch products";
        // Preserve existing products if previously loaded instead of wiping the UI
      });
  },
});

export const {
  invalidateProducts,
  productAdded,
  productUpdated,
  productDeleted,
} = productSlice.actions;

export const selectAllProducts = (state) => state.products?.products || [];
export const selectProductStatus = (state) =>
  state.products?.status || "idle";
export const selectProductLoading = (state) =>
  Boolean(state.products?.loading);
export const selectProductError = (state) => state.products?.error || null;
export const selectProductById = (productId) => (state) =>
  (state.products?.products || []).find(
    (item) => String(item.id) === String(productId),
  );

export default productSlice.reducer;