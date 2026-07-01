import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  authToken: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authToken: null,
      user: null,
      login: (token, user) => set({ authToken: token, user }),
      logout: () => set({ authToken: null, user: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);