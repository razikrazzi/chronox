import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/api\/?$/, "");

const WISHLISTS_URL = `${API_URL}/wishlists`;
const WISHLIST_STORAGE_KEY = "chronox_wishlist";

// ==========================================
// LOCAL STORAGE CACHE HELPERS
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

/**
 * Reads and validates the active user's cached wishlist from Local Storage.
 * Ensures the cache belongs to the specific userId to prevent data leakage.
 */
export const loadWishlistFromCache = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      String(parsed.userId) === String(userId) &&
      Array.isArray(parsed.items)
    ) {
      return {
        userId: String(parsed.userId),
        items: parsed.items,
        recordId: parsed.recordId || null,
        updatedAt: parsed.updatedAt || null,
      };
    }

    return null;
  } catch (error) {
    console.warn("ChronoX: Failed to read wishlist cache from Local Storage:", error);
    return null;
  }
};

/**
 * Saves the active user's wishlist cache synchronously to Local Storage.
 * Never stores passwords, tokens, or unrelated application state.
 */
export const saveWishlistToCache = (userId, items, recordId = null) => {
  if (!userId) return;
  try {
    const payload = {
      userId: String(userId),
      items: Array.isArray(items) ? items : [],
      updatedAt: new Date().toISOString(),
    };

    if (recordId) {
      payload.recordId = String(recordId);
    }

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("ChronoX: Failed to save wishlist cache to Local Storage:", error);
  }
};

/**
 * Removes only the active user's wishlist cache on logout or account switch.
 * Preserves all unrelated Local Storage keys.
 */
export const clearWishlistCache = () => {
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } catch (error) {
    console.warn("ChronoX: Failed to clear wishlist cache:", error);
  }
};

// ==========================================
// INITIAL STATE (Synchronous Cache Hydration)
// ==========================================

const initialUser = getStoredCurrentUser();
const initialCache = initialUser?.id
  ? loadWishlistFromCache(initialUser.id)
  : null;

const initialState = {
  items: initialCache?.items || [],
  userId: initialUser?.id ? String(initialUser.id) : null,
  recordId: initialCache?.recordId || null,
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  loading: false,
  error: null,
  pendingOperations: {},
};

const getUserId = (state) => state.wishlist?.userId;

// ==========================================
// SERIALIZED QUEUE PER USER
// ==========================================

// Map of userId -> current Promise chain.
// Serializes writes so rapid interactions never conflict or overwrite each other on JSON Server.
const userSyncQueues = new Map();

export const enqueueWishlistSync = (userId, dispatch, getState) => {
  const userKey = String(userId);
  const currentPromise = userSyncQueues.get(userKey) || Promise.resolve();

  const nextPromise = currentPromise
    .catch(() => {}) // preserve queue integrity even if previous sync failed
    .then(async () => {
      const state = getState();
      const activeUserId = state.wishlist?.userId;

      // Abort if user switched accounts or logged out while in queue
      if (!activeUserId || String(activeUserId) !== userKey) {
        return;
      }

      let recordId = state.wishlist?.recordId;

      // If recordId is not in Redux yet, check Local Storage cache first to avoid a GET
      if (!recordId) {
        const cached = loadWishlistFromCache(userKey);
        if (cached?.recordId) {
          recordId = cached.recordId;
          dispatch(setWishlistRecordId(recordId));
        }
      }

      // If still not known, query JSON Server once
      if (!recordId) {
        const getRes = await axios.get(WISHLISTS_URL, {
          params: { userId: userKey },
        });

        const records = Array.isArray(getRes.data) ? getRes.data : [];
        if (records.length > 0) {
          recordId = records[0].id;
          dispatch(setWishlistRecordId(recordId));

          // Clean up any extraneous duplicate records asynchronously
          if (records.length > 1) {
            for (let i = 1; i < records.length; i++) {
              axios.delete(`${WISHLISTS_URL}/${records[i].id}`).catch(() => {});
            }
          }
        }
      }

      // Re-verify active user after any network lookup
      const freshState = getState();
      if (String(freshState.wishlist?.userId) !== userKey) {
        return;
      }

      // Always read the absolute latest state right before sending to guarantee the freshest snapshot
      const latestItems = freshState.wishlist?.items || [];

      if (recordId) {
        await axios.patch(`${WISHLISTS_URL}/${recordId}`, {
          items: latestItems,
        });
      } else {
        const postRes = await axios.post(WISHLISTS_URL, {
          userId: userKey,
          items: latestItems,
        });
        if (postRes.data?.id) {
          recordId = postRes.data.id;
          dispatch(setWishlistRecordId(recordId));
          saveWishlistToCache(userKey, latestItems, recordId);
        }
      }
    });

  userSyncQueues.set(userKey, nextPromise);
  return nextPromise;
};

// ==========================================
// ASYNC THUNKS
// ==========================================

/**
 * Fetch or reconcile server data in the background.
 * Avoids duplicate requests if a fetch for this user is already in progress.
 */
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (arg, { getState, rejectWithValue }) => {
    const currentUserId =
      arg && typeof arg === "object"
        ? (arg.userId ?? getUserId(getState()))
        : (arg ?? getUserId(getState()));

    if (!currentUserId) {
      return { userId: null, recordId: null, items: [] };
    }

    try {
      const response = await axios.get(WISHLISTS_URL, {
        params: { userId: String(currentUserId) },
      });

      const records = Array.isArray(response.data) ? response.data : [];
      let record = records[0] || null;

      // Clean up server duplicate records if found
      if (records.length > 1) {
        for (let i = 1; i < records.length; i++) {
          axios.delete(`${WISHLISTS_URL}/${records[i].id}`).catch(() => {});
        }
      }

      // If no record exists yet on the server, create one with the user's initial or cached items
      if (!record) {
        const stateItems = getState().wishlist?.items || [];
        const createRes = await axios.post(WISHLISTS_URL, {
          userId: String(currentUserId),
          items: stateItems,
        });
        record = createRes.data;
      }

      return {
        userId: String(currentUserId),
        recordId: record?.id || null,
        items: Array.isArray(record?.items) ? record.items : [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch wishlist",
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      const { wishlist } = getState();
      const targetUserId =
        arg && typeof arg === "object"
          ? (arg.userId ?? wishlist.userId)
          : (arg ?? wishlist.userId);

      const isForce =
        arg === true || (typeof arg === "object" && Boolean(arg?.force));

      if (isForce) {
        return true;
      }

      if (!targetUserId) {
        return false;
      }

      // If already loading for this exact user, prevent duplicate concurrent network call
      if (
        wishlist.status === "loading" &&
        String(wishlist.userId) === String(targetUserId)
      ) {
        return false;
      }

      // If already successfully loaded for this exact user, skip redundant network call
      if (
        wishlist.status === "succeeded" &&
        String(wishlist.userId) === String(targetUserId)
      ) {
        return false;
      }

      return true;
    },
  },
);

/**
 * Add a product to the wishlist.
 * Updates Redux and Local Storage immediately in the pending reducer.
 * Persists in the background through the per-user serialized queue without a GET.
 */
export const addWishlistItem = createAsyncThunk(
  "wishlist/addWishlistItem",
  async (product, { getState, dispatch, rejectWithValue }) => {
    const userId = getUserId(getState());

    if (!userId) {
      return rejectWithValue("Please log in to use your wishlist.");
    }

    if (!product || product.id == null) {
      return rejectWithValue("Invalid product.");
    }

    try {
      await enqueueWishlistSync(userId, dispatch, getState);
      return {
        userId: String(userId),
        productId: String(product.id),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to save wishlist item.",
      );
    }
  },
);

/**
 * Remove a product from the wishlist.
 * Updates Redux and Local Storage immediately in the pending reducer.
 * Persists in the background through the per-user serialized queue without a GET.
 */
export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeWishlistItem",
  async (productIdArg, { getState, dispatch, rejectWithValue }) => {
    const userId = getUserId(getState());

    if (!userId) {
      return rejectWithValue("Please log in to manage your wishlist.");
    }

    const productId =
      typeof productIdArg === "object"
        ? String(productIdArg?.id ?? productIdArg?.productId ?? "")
        : String(productIdArg ?? "");

    if (!productId) {
      return rejectWithValue("Invalid product ID.");
    }

    try {
      await enqueueWishlistSync(userId, dispatch, getState);
      return {
        userId: String(userId),
        productId,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove wishlist item.",
      );
    }
  },
);

/**
 * Clear the wishlist.
 * Updates Redux and Local Storage immediately in the pending reducer.
 */
export const clearWishlistOnServer = createAsyncThunk(
  "wishlist/clearWishlistOnServer",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const userId = getUserId(getState());

    if (!userId) {
      return rejectWithValue("No logged-in user.");
    }

    try {
      await enqueueWishlistSync(userId, dispatch, getState);
      return { userId: String(userId) };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to clear wishlist.",
      );
    }
  },
);

// ==========================================
// WISHLIST SLICE
// ==========================================

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,

  reducers: {
    // Initialize or switch user session, hydrating from cache immediately
    initializeUserWishlist(state, action) {
      const nextUserId = action.payload ? String(action.payload) : null;

      // If the session is already active for this exact user:
      if (nextUserId && String(state.userId) === nextUserId) {
        // If already in-flight or successfully resolved, preserve state and do not reset status
        if (state.status === "loading" || state.status === "succeeded") {
          return;
        }
        // If status is idle and items not yet populated, hydrate from cache
        if (state.items.length === 0) {
          const cached = loadWishlistFromCache(nextUserId);
          if (cached && Array.isArray(cached.items)) {
            state.items = cached.items;
            state.recordId = cached.recordId || state.recordId || null;
          }
        }
        return;
      }

      // User switch or new login:
      state.userId = nextUserId;
      state.error = null;
      state.pendingOperations = {};

      if (nextUserId) {
        const cached = loadWishlistFromCache(nextUserId);
        if (cached && Array.isArray(cached.items)) {
          state.items = cached.items;
          state.recordId = cached.recordId || null;
        } else {
          state.items = [];
          state.recordId = null;
        }
        state.status = "idle";
        state.loading = false;
      } else {
        state.items = [];
        state.recordId = null;
        state.status = "idle";
        state.loading = false;
      }
    },

    setWishlistRecordId(state, action) {
      state.recordId = action.payload;
      if (state.userId) {
        saveWishlistToCache(state.userId, state.items, state.recordId);
      }
    },

    clearUserWishlist(state) {
      clearWishlistCache();
      state.items = [];
      state.userId = null;
      state.recordId = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.pendingOperations = {};
    },

    clearWishlist(state) {
      state.items = [];
      if (state.userId) {
        saveWishlistToCache(state.userId, [], state.recordId);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ========================================
      // FETCH / RECONCILE WISHLIST
      // ========================================
      .addCase(fetchWishlist.pending, (state, action) => {
        const targetUserId =
          action.meta.arg && typeof action.meta.arg === "object"
            ? (action.meta.arg.userId ?? state.userId)
            : (action.meta.arg ?? state.userId);

        if (targetUserId) {
          state.userId = String(targetUserId);
        }

        // Mark the request as running to prevent duplicate fetches.
        state.status = "loading";

        // Only show loading when there are no cached wishlist items.
        state.loading = state.items.length === 0;

        state.error = null;
      })

      .addCase(fetchWishlist.fulfilled, (state, action) => {
        // Prevent stale responses if the user changed while request was in-flight
        if (
          action.payload.userId &&
          String(state.userId) !== String(action.payload.userId)
        ) {
          return;
        }

        state.status = "succeeded";
        state.loading = false;
        state.recordId = action.payload.recordId;
        state.error = null;

        const serverItems = Array.isArray(action.payload.items)
          ? action.payload.items
          : [];

        const pendingOps = Object.values(state.pendingOperations || {});

        if (pendingOps.length === 0) {
          // No in-flight optimistic operations: server is authoritative
          state.items = serverItems;
        } else {
          // In-flight optimistic mutations exist: reconcile without dropping local mutations
          const pendingRemoveIds = new Set(
            pendingOps
              .filter((op) => op.type === "remove")
              .map((op) => String(op.productId)),
          );

          const pendingAddMap = new Map();
          pendingOps
            .filter((op) => op.type === "add" && op.product)
            .forEach((op) => {
              pendingAddMap.set(String(op.productId), op.product);
            });

          // Keep server items that were not optimistically removed
          const reconciled = serverItems.filter(
            (item) => !pendingRemoveIds.has(String(item.id)),
          );

          // Add any newly added optimistic items not yet on the server
          pendingAddMap.forEach((product, id) => {
            if (!reconciled.some((item) => String(item.id) === id)) {
              reconciled.push(product);
            }
          });

          state.items = reconciled;
        }

        // Keep Local Storage cache in sync with reconciled data
        if (state.userId) {
          saveWishlistToCache(state.userId, state.items, state.recordId);
        }
      })

      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || action.error?.message;
        // Cached items are preserved on network failure
      })

      // ========================================
      // ADD WISHLIST ITEM (Optimistic Update)
      // ========================================
      .addCase(addWishlistItem.pending, (state, action) => {
        const product = action.meta.arg;
        if (!product || product.id == null) return;

        const productId = String(product.id);
        const requestId = action.meta.requestId;

        state.pendingOperations[requestId] = {
          type: "add",
          productId,
          product,
          userId: state.userId,
        };

        const exists = state.items.some(
          (item) => String(item.id) === productId,
        );

        if (!exists) {
          state.items.push(product);
          // Synchronous Local Storage update
          if (state.userId) {
            saveWishlistToCache(state.userId, state.items, state.recordId);
          }
        }

        state.error = null;
      })

      .addCase(addWishlistItem.fulfilled, (state, action) => {
        delete state.pendingOperations[action.meta.requestId];
      })

      .addCase(addWishlistItem.rejected, (state, action) => {
        const operation = state.pendingOperations[action.meta.requestId];
        const product = action.meta.arg;
        const productId = String(operation?.productId || product?.id || "");

        // Roll back ONLY the affected item, keeping unrelated successful items safe
        if (productId && String(state.userId) === String(operation?.userId || state.userId)) {
          state.items = state.items.filter(
            (item) => String(item.id) !== productId,
          );
          if (state.userId) {
            saveWishlistToCache(state.userId, state.items, state.recordId);
          }
        }

        delete state.pendingOperations[action.meta.requestId];
        state.error = action.payload || action.error?.message || "Failed to update wishlist.";
      })

      // ========================================
      // REMOVE WISHLIST ITEM (Optimistic Update)
      // ========================================
      .addCase(removeWishlistItem.pending, (state, action) => {
        const productId =
          typeof action.meta.arg === "object"
            ? String(action.meta.arg?.id ?? action.meta.arg?.productId ?? "")
            : String(action.meta.arg ?? "");

        const requestId = action.meta.requestId;

        const removedProduct = state.items.find(
          (item) => String(item.id) === productId,
        );

        state.pendingOperations[requestId] = {
          type: "remove",
          productId,
          product: removedProduct,
          userId: state.userId,
        };

        state.items = state.items.filter(
          (item) => String(item.id) !== productId,
        );

        // Synchronous Local Storage update
        if (state.userId) {
          saveWishlistToCache(state.userId, state.items, state.recordId);
        }

        state.error = null;
      })

      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        delete state.pendingOperations[action.meta.requestId];
      })

      .addCase(removeWishlistItem.rejected, (state, action) => {
        const operation = state.pendingOperations[action.meta.requestId];

        // Roll back ONLY the affected item by restoring it to the items array
        if (
          operation?.product &&
          String(state.userId) === String(operation.userId)
        ) {
          const alreadyExists = state.items.some(
            (item) => String(item.id) === operation.productId,
          );

          if (!alreadyExists) {
            state.items.push(operation.product);
            if (state.userId) {
              saveWishlistToCache(state.userId, state.items, state.recordId);
            }
          }
        }

        delete state.pendingOperations[action.meta.requestId];
        state.error = action.payload || action.error?.message || "Failed to remove wishlist item.";
      })

      // ========================================
      // CLEAR WISHLIST (Optimistic Update)
      // ========================================
      .addCase(clearWishlistOnServer.pending, (state, action) => {
        state.pendingOperations[action.meta.requestId] = {
          type: "clear",
          items: [...state.items],
          userId: state.userId,
        };

        state.items = [];
        if (state.userId) {
          saveWishlistToCache(state.userId, [], state.recordId);
        }
        state.error = null;
      })

      .addCase(clearWishlistOnServer.fulfilled, (state, action) => {
        delete state.pendingOperations[action.meta.requestId];
      })

      .addCase(clearWishlistOnServer.rejected, (state, action) => {
        const operation = state.pendingOperations[action.meta.requestId];

        if (
          operation &&
          String(state.userId) === String(operation.userId)
        ) {
          state.items = operation.items || [];
          if (state.userId) {
            saveWishlistToCache(state.userId, state.items, state.recordId);
          }
        }

        delete state.pendingOperations[action.meta.requestId];
        state.error = action.payload || action.error?.message || "Failed to clear wishlist.";
      });
  },
});

export const {
  initializeUserWishlist,
  setWishlistRecordId,
  clearUserWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist?.items || [];
export const selectWishlistCount = (state) =>
  state.wishlist?.items?.length || 0;
export const selectWishlistStatus = (state) =>
  state.wishlist?.status || "idle";
export const selectWishlistLoading = (state) =>
  Boolean(state.wishlist?.loading);
export const selectWishlistError = (state) => state.wishlist?.error || null;
export const selectIsProductLiked = (productId) => (state) =>
  Boolean(
    (state.wishlist?.items || []).some(
      (item) => String(item.id) === String(productId),
    ),
  );

export default wishlistSlice.reducer;