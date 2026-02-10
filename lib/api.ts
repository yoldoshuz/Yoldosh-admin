import axios, { AxiosError } from "axios";
import { toast } from "sonner";

// https://yoldosh-api.onrender.com
// https://yoldosh-api.onrender.com/api/v1

// http://localhost:5000
// http://localhost:5000/api/v1

// https://api.yoldosh.uz
// https://api.yoldosh.uz/api/v1

export const baseUrl = "https://api.yoldosh.uz";
export const baseUrlApi = "https://api.yoldosh.uz/api/v1";

// A more Vercel-like toast for errors
const showErrorToast = (message: string) => {
  toast.error(message, {
    style: {
      borderLeft: "4px solid #f00",
      color: "#000",
      backgroundColor: "#fff",
    },
    className: "vercel-error-toast",
  });
};

const api = axios.create({
  baseURL: baseUrlApi,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const isSuperAdminRoute = window.location.pathname.startsWith("/super-admin");

    let token = null;
    let tokenKey = null;

    if (isSuperAdminRoute) {
      tokenKey = "super-admin-token";
      token = localStorage.getItem(tokenKey);
    } else if (isAdminRoute) {
      // Для обычных админов используем старый ключ или новый, если он есть
      tokenKey = "admin-token";
      token = localStorage.getItem(tokenKey);
    } else {
      // Если мы на странице логина "/", пробуем найти любой токен для AuthGuard
      token = localStorage.getItem("super-admin-token") || localStorage.getItem("admin-token");
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // This logic handles API errors for an already authenticated session.
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAdminRoute = window.location.pathname.startsWith("/admin");
      const isSuperAdminRoute = window.location.pathname.startsWith("/super-admin");
      const tokenKeyToRemove = isSuperAdminRoute ? "super-admin-token" : "admin-token";

      // Только если мы не на главной странице, чтобы избежать цикла редиректов при первой загрузке
      if (window.location.pathname !== "/") {
        localStorage.removeItem(tokenKeyToRemove);
        window.location.href = "/"; // Перенаправляем на логин
        showErrorToast("Сессия истекла. Пожалуйста, войдите снова.");
      }
    }

    const data: any = error.response?.data;
    const errorMessage = data?.message || "Произошла непредвиденная ошибка";
    showErrorToast(errorMessage);

    return Promise.reject(error);
  }
);

export default api;
