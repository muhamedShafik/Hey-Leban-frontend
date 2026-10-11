// src/store/authStore.js
import { create } from "zustand";
import api from "../services/api";
import { useSessionStore } from "./sessionStore";
import { useCartStore } from "./cartStore";
import { getShopDetails } from "../services/profileService";

const STORAGE_KEY = "pos_saved_accounts";

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistAccounts(accounts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  shop: null,
  savedAccounts: getStoredAccounts(),
  isAuthenticated: false,
  isAuthLoading: true,

  initializeAuth: async () => {
    try {
      const response = await api.post("/api/auth/refresh", {});
      const { accessToken, user } = response.data.data;

      window.accessToken = accessToken;

      let shop = null;
      try {
        shop = await getShopDetails();
      } catch {
        // Non-critical
      }

      // Update saved accounts list with this active user
      const currentList = getStoredAccounts();
      const existingIdx = currentList.findIndex(
        (a) => a.id === user.id || a.email?.toLowerCase() === user.email?.toLowerCase()
      );

      const accountRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        shop,
        lastUsedAt: Date.now(),
      };

      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...accountRecord };
      } else {
        updatedList = [accountRecord, ...currentList];
      }
      persistAccounts(updatedList);

      set({
        user: user ?? null,
        shop,
        savedAccounts: updatedList,
        isAuthenticated: true,
        isAuthLoading: false,
      });
    } catch {
      // ── Cross-origin cookie blocked (iOS Safari ITP) or cookie expired ──
      // /api/auth/refresh relies on an HttpOnly cookie that iOS Safari blocks
      // when the frontend and backend are on different domains.
      // Fallback: validate the stored access token directly via a Bearer-only
      // endpoint (/api/profile/shop) — no cookie needed.
      const currentList = getStoredAccounts();
      const lastUsed = [...currentList].sort(
        (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
      )[0];

      if (lastUsed?.accessToken) {
        window.accessToken = lastUsed.accessToken;

        try {
          // Probe with a Bearer-token-only call — does NOT need the refresh cookie
          const shop = await getShopDetails();

          // Token is still valid — restore the session from localStorage
          const updatedList = currentList.map((a) =>
            a.id === lastUsed.id
              ? { ...a, shop: shop ?? a.shop, lastUsedAt: Date.now() }
              : a
          );
          persistAccounts(updatedList);

          set({
            user: {
              id: lastUsed.id,
              name: lastUsed.name,
              email: lastUsed.email,
              role: lastUsed.role,
            },
            shop: shop ?? lastUsed.shop ?? null,
            savedAccounts: updatedList,
            isAuthenticated: true,
            isAuthLoading: false,
          });
          return;
        } catch {
          // Access token also expired → full re-login required
          window.accessToken = null;
        }
      }

      window.accessToken = null;
      set({
        user: null,
        shop: null,
        savedAccounts: currentList,
        isAuthenticated: false,
        isAuthLoading: false,
      });
    }
  },



  login: async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    const { accessToken, user } = response.data.data;

    window.accessToken = accessToken;

    let shop = null;
    try {
      shop = await getShopDetails();
    } catch {
      // Non-critical
    }

    // Save to multi-account list
    const currentList = getStoredAccounts();
    const existingIdx = currentList.findIndex(
      (a) => a.id === user.id || a.email?.toLowerCase() === user.email?.toLowerCase()
    );

    const accountRecord = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      shop,
      lastUsedAt: Date.now(),
    };

    let updatedList;
    if (existingIdx >= 0) {
      updatedList = [...currentList];
      updatedList[existingIdx] = { ...updatedList[existingIdx], ...accountRecord };
    } else {
      updatedList = [accountRecord, ...currentList];
    }
    persistAccounts(updatedList);

    set({
      user,
      shop,
      savedAccounts: updatedList,
      isAuthenticated: true,
      isAuthLoading: false,
    });

    return user;
  },

  // Add another account without signing out the current one
  addAccount: async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    const { accessToken, user } = response.data.data;

    window.accessToken = accessToken;

    let shop = null;
    try {
      shop = await getShopDetails();
    } catch {
      // Non-critical
    }

    const currentList = getStoredAccounts();
    const existingIdx = currentList.findIndex(
      (a) => a.id === user.id || a.email?.toLowerCase() === user.email?.toLowerCase()
    );

    const accountRecord = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      shop,
      lastUsedAt: Date.now(),
    };

    let updatedList;
    if (existingIdx >= 0) {
      updatedList = [...currentList];
      updatedList[existingIdx] = { ...updatedList[existingIdx], ...accountRecord };
    } else {
      updatedList = [accountRecord, ...currentList];
    }
    persistAccounts(updatedList);

    // Reset current caches for new active user
    useSessionStore.getState().clearTodaySession();
    useCartStore.getState().resetAfterPayment();

    set({
      user,
      shop,
      savedAccounts: updatedList,
      isAuthenticated: true,
      isAuthLoading: false,
    });

    return user;
  },

  // Switch to one of the saved accounts
  switchAccount: async (targetUserId) => {
    const currentList = getStoredAccounts();
    const target = currentList.find((a) => a.id === targetUserId);
    if (!target) return false;

    // Set new token
    window.accessToken = target.accessToken;

    // Reset session & cart state
    useSessionStore.getState().clearTodaySession();
    useCartStore.getState().resetAfterPayment();

    // Mark lastUsedAt
    const updatedList = currentList.map((acc) =>
      acc.id === targetUserId ? { ...acc, lastUsedAt: Date.now() } : acc
    );
    persistAccounts(updatedList);

    set({
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
      },
      shop: target.shop || null,
      savedAccounts: updatedList,
      isAuthenticated: true,
      isAuthLoading: false,
    });

    // Try to refresh token or re-fetch shop in background
    try {
      const shop = await getShopDetails();
      set({ shop });
    } catch {
      // Non-critical
    }

    return true;
  },

  // Remove a specific saved account
  removeSavedAccount: (targetUserId) => {
    const currentList = getStoredAccounts();
    const updatedList = currentList.filter((a) => a.id !== targetUserId);
    persistAccounts(updatedList);

    const currentUser = get().user;
    const isRemovingActive = currentUser?.id === targetUserId;

    if (isRemovingActive) {
      if (updatedList.length > 0) {
        // Switch to the first available account
        get().switchAccount(updatedList[0].id);
      } else {
        // No accounts left, log out completely
        get().logout();
      }
    } else {
      set({ savedAccounts: updatedList });
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore logout API error
    }

    const currentUser = get().user;
    const currentList = getStoredAccounts();
    // Remove current user from saved accounts or keep list clean
    const updatedList = currentUser
      ? currentList.filter((a) => a.id !== currentUser.id)
      : [];
    persistAccounts(updatedList);

    window.accessToken = null;
    useSessionStore.getState().clearTodaySession();
    useCartStore.getState().resetAfterPayment();

    set({
      user: null,
      shop: null,
      savedAccounts: updatedList,
      isAuthenticated: false,
      isAuthLoading: false,
    });
  },

  // Sign out of all saved accounts completely
  logoutAll: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    window.accessToken = null;
    useSessionStore.getState().clearTodaySession();
    useCartStore.getState().resetAfterPayment();

    set({
      user: null,
      shop: null,
      savedAccounts: [],
      isAuthenticated: false,
      isAuthLoading: false,
    });
  },

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  clearAuth: () => {
    window.accessToken = null;
    useSessionStore.getState().clearTodaySession();
    useCartStore.getState().resetAfterPayment();

    set({
      user: null,
      shop: null,
      isAuthenticated: false,
      isAuthLoading: false,
    });
  },
}));