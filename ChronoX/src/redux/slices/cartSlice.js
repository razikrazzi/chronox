import { createSlice } from "@reduxjs/toolkit";

// ==========================================
// STORAGE HELPERS
// ==========================================

const getStoredCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem("chronox_user") ||
      localStorage.getItem("chronox_current_user") ||
      localStorage.getItem("user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Each user has a separate cart key.
const getCartStorageKey = (userId) => {
  return userId ? `chronox_cart_${userId}` : null;
};

// Load a user's cart from Local Storage.
const loadCartFromStorage = (userId) => {
  if (!userId) return [];

  try {
    const storageKey = getCartStorageKey(userId);

    let raw = localStorage.getItem(storageKey);

    // Read the old key if the new key does not exist.
    // This helps preserve existing cart data.
    if (raw === null) {
      const legacyKey = `cart_${userId}`;
      raw = localStorage.getItem(legacyKey);

      // Migrate legacy data to the new key.
      if (raw !== null) {
        localStorage.setItem(storageKey, raw);
        localStorage.removeItem(legacyKey);
      }
    }

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
};

// Save the cart under the current user's key only.
const saveCartToStorage = (userId, items) => {
  if (!userId) return;

  try {
    const storageKey = getCartStorageKey(userId);

    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
};

// ==========================================
// INITIAL STATE
// ==========================================

const initialUser = getStoredCurrentUser();

const initialState = {
  items: initialUser?.id
    ? loadCartFromStorage(String(initialUser.id))
    : [],

  userId: initialUser?.id ? String(initialUser.id) : null,
};

// ==========================================
// CART SLICE
// ==========================================

const cartSlice = createSlice({
  name: "cart",

  initialState,

  reducers: {
    // --------------------------------------
    // INITIALIZE CART FOR A LOGGED-IN USER
    // --------------------------------------

    initializeUserCart: (state, action) => {
      const userId = action.payload
        ? String(action.payload)
        : null;

      state.userId = userId;
      state.items = userId ? loadCartFromStorage(userId) : [];
    },

    // --------------------------------------
    // CLEAR CURRENT USER'S CART FROM REDUX
    // --------------------------------------

    clearUserCart: (state) => {
      state.userId = null;
      state.items = [];
    },

    // --------------------------------------
    // ADD PRODUCT TO CART
    // --------------------------------------

    addToCart: (state, action) => {
      // If state.userId was not set yet, check session
      if (!state.userId) {
        const storedUser = getStoredCurrentUser();
        if (storedUser?.id) {
          state.userId = String(storedUser.id);
          state.items = loadCartFromStorage(state.userId);
        } else {
          return;
        }
      }

      const product = action.payload;

      if (!product || product.id == null) return;

      const quantityToAdd = Math.max(
        1,
        Math.floor(Number(product.quantity) || 1),
      );

      const existingItem = state.items.find(
        (item) => String(item.id) === String(product.id),
      );

      if (existingItem) {
        existingItem.quantity =
          Math.max(1, Number(existingItem.quantity) || 1) +
          quantityToAdd;
      } else {
        state.items.push({
          id: product.id,
          name: product.name || "Unnamed Product",
          image: product.image || "",
          model: product.model || "",
          collection: product.collection || "CHRONOX",
          price: Math.max(0, Number(product.price) || 0),
          quantity: quantityToAdd,
          material: product.material || "",
          limited: product.limited || false,
        });
      }

      saveCartToStorage(state.userId, state.items);
    },

    // --------------------------------------
    // REMOVE PRODUCT
    // --------------------------------------

    removeFromCart: (state, action) => {
      if (!state.userId) return;

      const productId = action.payload;

      state.items = state.items.filter(
        (item) => String(item.id) !== String(productId),
      );

      saveCartToStorage(state.userId, state.items);
    },

    // --------------------------------------
    // INCREASE QUANTITY
    // --------------------------------------

    increaseQuantity: (state, action) => {
      if (!state.userId) return;

      const productId = action.payload;

      const item = state.items.find(
        (product) => String(product.id) === String(productId),
      );

      if (item) {
        item.quantity = Math.max(
          1,
          Number(item.quantity) || 1,
        ) + 1;

        saveCartToStorage(state.userId, state.items);
      }
    },

    // --------------------------------------
    // DECREASE QUANTITY
    // --------------------------------------

    decreaseQuantity: (state, action) => {
      if (!state.userId) return;

      const productId = action.payload;

      const item = state.items.find(
        (product) => String(product.id) === String(productId),
      );

      if (item && Number(item.quantity) > 1) {
        item.quantity -= 1;

        saveCartToStorage(state.userId, state.items);
      }
    },

    // --------------------------------------
    // UPDATE QUANTITY
    // --------------------------------------

    updateQuantity: (state, action) => {
      if (!state.userId) return;

      const { id, quantity } = action.payload || {};

      const parsedQuantity = Number(quantity);

      const item = state.items.find(
        (product) => String(product.id) === String(id),
      );

      if (
        item &&
        Number.isInteger(parsedQuantity) &&
        parsedQuantity > 0
      ) {
        item.quantity = parsedQuantity;

        saveCartToStorage(state.userId, state.items);
      }
    },

    // --------------------------------------
    // CLEAR CART ITEMS
    // --------------------------------------

    clearCart: (state) => {
      if (!state.userId) {
        state.items = [];
        return;
      }

      state.items = [];

      saveCartToStorage(state.userId, []);
    },
  },
});

// ==========================================
// EXPORT ACTIONS & SELECTORS
// ==========================================

export const {
  initializeUserCart,
  clearUserCart,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart?.items || [];
export const selectCartCount = (state) =>
  (state.cart?.items || []).reduce(
    (acc, item) => acc + (Number(item.quantity) || 1),
    0,
  );
export const selectCartSubtotal = (state) =>
  (state.cart?.items || []).reduce(
    (acc, item) =>
      acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
export const selectCartTotal = (state) => selectCartSubtotal(state);

export default cartSlice.reducer;