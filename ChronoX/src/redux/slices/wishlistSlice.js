import { createSlice } from "@reduxjs/toolkit";

const getStoredCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem("chronox_current_user") ||
      localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadWishlistFromStorage = (userId) => {
  if (!userId) return [];
  try {
    const raw =
      localStorage.getItem(`chronox_wishlist_${userId}`) ||
      localStorage.getItem(`wishlist_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveWishlistToStorage = (userId, items) => {
  if (!userId) return;
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(`chronox_wishlist_${userId}`, serialized);
    localStorage.setItem(`wishlist_${userId}`, serialized);
  } catch (error) {
    console.error("Failed to save wishlist to localStorage:", error);
  }
};

const initialUser = getStoredCurrentUser();

const initialState = {
  items: initialUser?.id ? loadWishlistFromStorage(initialUser.id) : [],
  userId: initialUser?.id || null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,

  reducers: {
    initializeUserWishlist: (state, action) => {
      const userId = action.payload;
      state.userId = userId;
      state.items = loadWishlistFromStorage(userId);
    },

    clearUserWishlist: (state) => {
      state.userId = null;
      state.items = [];
    },

    addToWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.items.some(
        (item) => String(item.id) === String(product.id),
      );

      if (!exists) {
        state.items.push(product);
        saveWishlistToStorage(state.userId, state.items);
      }
    },

    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (item) => String(item.id) !== String(productId),
      );
      saveWishlistToStorage(state.userId, state.items);
    },

    toggleWishlist: (state, action) => {
      const product = action.payload;
      const index = state.items.findIndex(
        (item) => String(item.id) === String(product.id),
      );

      if (index > -1) {
        state.items.splice(index, 1);
      } else {
        state.items.push(product);
      }

      saveWishlistToStorage(state.userId, state.items);
    },

    clearWishlist: (state) => {
      state.items = [];
      saveWishlistToStorage(state.userId, []);
    },
  },
});

export const {
  initializeUserWishlist,
  clearUserWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
