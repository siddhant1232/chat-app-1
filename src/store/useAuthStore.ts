import { create } from "zustand";
import toast from "react-hot-toast";
import io, { type Socket } from "socket.io-client";

const BASE_URL =
  import.meta.env.VITE_WORKING_MODE === "development"
    ? "http://localhost:5001"
    : "https://chat-app-vyqv.onrender.com";

interface SignupData {
  fullname: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ProfileUpdateData {
  fullname?: string;
  profilepic?: string;
}

interface AuthUser {
  _id: string;
  email: string;
  fullname: string;
  profilepic: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthStore {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: SocketIOClient.Socket;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null as unknown as typeof Socket,

  checkAuth: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/check`, {
        method: "GET",
        credentials: "include", // Send cookies along
        headers: {
          // If there's a token, add it here (you may have to manage it in cookies or localStorage)
          "Authorization": `Bearer ${document.cookie}`, // or replace with your own method of storing the token
        },
      });
  
      if (!res.ok) throw new Error("Failed to check auth");
  
      const data = await res.json();
      set({ authUser: data });
      get().connectSocket();
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  

  signup: async (data: SignupData) => {
    set({ isSigningUp: true });
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.message || "Signup failed");

      set({ authUser: resData });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true });
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.message || "Login failed");

      set({ authUser: resData });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.message || "Logout failed");

      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    }
  },

  updateProfile: async (data: ProfileUpdateData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.message || "Update failed");

      set({ authUser: resData });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${document.cookie}`,
          },
        },
      },
      query: {
        userId: authUser._id,
      },
    });

    socket.on("connect", () => {
      console.log("Socket connected!");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
