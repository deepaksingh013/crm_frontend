import axios from "axios";
import Cookies from "js-cookie";
import {
  apiRequest,
  apiSuccess,
  apiError,
} from "./apiSlice";

const API_URL = process.env.REACT_APP_API_URL?.trim();

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token")}`,
  },
});


// POST
export const apiPost = (url, payload) => async (dispatch) => {
  try {
    dispatch(apiRequest());

    const response = await axios.post(`${API_URL}${url}`, payload, getHeaders());

    dispatch(apiSuccess(response.data));

    return response.data;
  } catch (error) {
    dispatch(
      apiError(
        error.response?.data?.message || "Something went wrong"
      )
    );

    throw error;
  }
};


// GET
export const apiGet = (url) => async (dispatch) => {
  try {
    dispatch(apiRequest());

    const response = await axios.get(`${API_URL}${url}`, getHeaders());

    dispatch(apiSuccess(response.data));

    return response.data;
  } catch (error) {
    dispatch(
      apiError(
        error.response?.data?.message || "Something went wrong"
      )
    );

    throw error;
  }
};


// PATCH
export const apiPatch = (url, payload) => async (dispatch) => {
  try {
    dispatch(apiRequest());

    const response = await axios.patch(`${API_URL}${url}`, payload, getHeaders());

    dispatch(apiSuccess(response.data));

    return response.data;
  } catch (error) {
    dispatch(
      apiError(
        error.response?.data?.message || "Something went wrong"
      )
    );

    throw error;
  }
};


// PUT
export const apiPut = (url, payload) => async (dispatch) => {
  try {
    dispatch(apiRequest());

    const response = await axios.put(`${API_URL}${url}`, payload, getHeaders());

    dispatch(apiSuccess(response.data));

    return response.data;
  } catch (error) {
    dispatch(
      apiError(
        error.response?.data?.message || "Something went wrong"
      )
    );

    throw error;
  }
};


// DELETE
export const apiDelete = (url) => async (dispatch) => {
  try {
    dispatch(apiRequest());

    const response = await axios.delete(`${API_URL}${url}`, getHeaders());

    dispatch(apiSuccess(response.data));

    return response.data;
  } catch (error) {
    dispatch(
      apiError(
        error.response?.data?.message || "Something went wrong"
      )
    );

    throw error;
  }
};
