import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    apiRequest: (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    },
    apiSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.data = action.payload;
    },
    apiError: (state, action) => {
      state.loading = false;
      state.success = false;
      state.error = action.payload;
    },
    resetApiState: () => initialState,
  },
});

export const { apiRequest, apiSuccess, apiError, resetApiState } = apiSlice.actions;

export default apiSlice.reducer;
