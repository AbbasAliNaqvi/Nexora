import { create } from "zustand";
import api from "../lib/api";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("nxr_token") || null,
  loading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("nxr_token", data.token);
    set({ user: data.user, token: data.token });
    return data.user;
  },

  register: async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem("nxr_token", data.token);
    set({ user: data.user, token: data.token });
    return data.user;
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      localStorage.removeItem("nxr_token");
      set({ user: null, token: null, loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("nxr_token");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;