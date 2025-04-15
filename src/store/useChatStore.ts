// src/store/useChatStore.ts
import { create } from "zustand";
import toast from "react-hot-toast";
import io from "socket.io-client";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  createdAt: string;
}

interface User {
  _id: string;
  fullname: string;
  profilepic?: string;
}

interface ChatStoreState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  socket: any;
  initializeSocket: () => void;
  disconnectSocket: () => void;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image?: File | string }) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

const BASE_URL =
  import.meta.env.VITE_WORKING_MODE === "production"
    ? "https://chat-app-vyqv.onrender.com"
    : "http://localhost:5001";

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,

  initializeSocket: () => {
    const socket = io(BASE_URL, {
      autoConnect: false,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("newMessage", (newMessage: Message) => {
      const { selectedUser } = get();
      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id)
      ) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    });

    set({ socket });
    socket.connect();
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/messages/users`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load users");

      set({ users: data });
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error(error.message || "Failed to load users");

      if (error.message?.includes("401")) {
        window.location.href = "/signin";
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/api/messages/${userId}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load messages");

      set({ messages: data });
    } catch (error: any) {
      toast.error(error.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, socket } = get();
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("text", messageData.text || "");
  
      if (messageData.image) {
        const file = messageData.image instanceof File 
          ? messageData.image 
          : await dataUrlToFile(messageData.image);
        formData.append("file", file);
      }
  
      const res = await fetch(`${BASE_URL}/api/messages/send/${selectedUser._id}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to send message");
      }
  
      const newMessage = await res.json();
      
      // Update local state immediately
      set((state) => ({ 
        messages: [...state.messages, newMessage],
      }));
  
      // Emit via socket if available
      if (socket) {
        socket.emit("sendMessage", newMessage);
      }
  
      return newMessage;
    } catch (error: any) {
      console.error("Send failed:", error);
      toast.error(error.message || "Failed to send message");
      throw error;
    }
  },
  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
    if (user) get().getMessages(user._id);
  },

  subscribeToMessages: () => {
    const { socket, selectedUser } = get();
    if (!socket || !selectedUser) return;

    socket.on("newMessage", (newMessage: Message) => {
      if (
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id
      ) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = get();
    if (socket) {
      socket.off("newMessage");
    }
  },
}));
function dataUrlToFile(dataUrl: string): File {
  const [header, base64Data] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Invalid data URL");
  }
  const mimeType = mimeMatch[1];
  const binaryString = atob(base64Data);
  const byteArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return new File([byteArray], "image", { type: mimeType });
}

