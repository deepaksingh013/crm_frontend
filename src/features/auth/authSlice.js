import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const initialState = {
  user: null,
  token: Cookies.get("token") || null,
  role: Cookies.get("role") || null,
  isAuthenticated: !!Cookies.get("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      const { token, role, user } = action.payload;
      state.token = token;
      state.role = role;
      state.user = user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;

      Cookies.set("token", token, { expires: 7 });
      Cookies.set("role", role, { expires: 7 });
      Cookies.set("user", JSON.stringify(user), { expires: 7 });
    },

    // Login failure
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.token = null;
      state.role = null;
      state.user = null;
    },

    // Logout request
    logoutRequest: (state) => {
      state.loading = true;
    },

    // Logout success
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      // Clear cookies
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("user");
    },

    // Set user from cookies (on app load)
    setUserFromCookies: (state) => {
      const token = Cookies.get("token");
      const role = Cookies.get("role");
      const user = Cookies.get("user");

      if (token && role) {
        state.token = token;
        state.role = role;
        state.user = user ? JSON.parse(user) : null;
        state.isAuthenticated = true;
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  setUserFromCookies,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
