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

const getCartStorageKey = (userId) => {
  return userId ? `chronox_cart_${userId}` : null;
};

const loadCartFromStorage = (userId) => {
  if (!userId) return [];
  try {
    // Check both standard key and legacy key
    const raw =
      localStorage.getItem(`chronox_cart_${userId}`) ||
      localStorage.getItem(`cart_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (userId, items) => {
  if (!userId) return;
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(`chronox_cart_${userId}`, serialized);
    localStorage.setItem(`cart_${userId}`, serialized);
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
};

const initialUser = getStoredCurrentUser();

const initialState = {
  items: initialUser?.id ? loadCartFromStorage(initialUser.id) : [],
  userId: initialUser?.id || null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {
    initializeUserCart: (state, action) => {
      const userId = action.payload;
      state.userId = userId;
      state.items = loadCartFromStorage(userId);
    },

    clearUserCart: (state) => {
      state.userId = null;
      state.items = [];
    },

    addToCart: (state, action) => {
      const product = action.payload;
      const quantityToAdd = Number(product.quantity) || 1;

      const existingItem = state.items.find(
        (item) => String(item.id) === String(product.id),
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantityToAdd;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          image: product.image,
          model: product.model,
          collection: product.collection || "CHRONOX",
          price: Number(product.price) || 0,
          quantity: quantityToAdd,
          material: product.material,
          limited: product.limited,
        });
      }

      saveCartToStorage(state.userId, state.items);
    },

    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (item) => String(item.id) !== String(productId),
      );
      saveCartToStorage(state.userId, state.items);
    },

    increaseQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(
        (i) => String(i.id) === String(productId),
      );

      if (item) {
        item.quantity = (item.quantity || 1) + 1;
        saveCartToStorage(state.userId, state.items);
      }
    },

    decreaseQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(
        (i) => String(i.id) === String(productId),
      );

      if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCartToStorage(state.userId, state.items);
      }
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => String(i.id) === String(id));

      if (item && quantity > 0) {
        item.quantity = quantity;
        saveCartToStorage(state.userId, state.items);
      }
    },

    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.userId, []);
    },
  },
});

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

export default cartSlice.reducer;