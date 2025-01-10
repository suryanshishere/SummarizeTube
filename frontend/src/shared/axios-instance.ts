import axios from "axios";
import store from "store";
import { handleAccountDeactivatedAt } from "store/auth-slice";
 
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5050/api";

const getTokenFromLocalStorage = () => {
  const state = JSON.parse(localStorage.getItem("persist:auth") || "{}");
  const userData = state.userData ? JSON.parse(state.userData) : null;
  return userData ? userData.token : null;
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getTokenFromLocalStorage()}`,
  },
});

//prevent any !get request before hand only
axiosInstance.interceptors.request.use((config) => {
  const deactivatedAt = store.getState().auth.userData.deactivatedAt;
  const authHeader =
    config.headers["Authorization"] || config.headers["authorization"];
  if (
    deactivatedAt &&
    config.method !== "get" &&
    authHeader &&
    config.url &&
    !EXEMPT_URLS.includes(config.url)
  ) {
    return Promise.reject({
      response: {
        data: {
          message: "Your account is deactivated. Please activate it first.",
        },
      },
    });
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data) {
      const deactivatedAt = response.data.deactivated_at;
      store.dispatch(handleAccountDeactivatedAt(deactivatedAt));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

const EXEMPT_URLS = ["/user/account/activate-account"];
