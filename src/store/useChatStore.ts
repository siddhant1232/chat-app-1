import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
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
  socket: any; // Consider proper typing for socket
  initializeSocket: () => void;
  disconnectSocket: () => void;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image?: string }) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,

  initializeSocket: () => {
    const socket = io(import.meta.env.VITE_WORKING_MODE === 'production' 
      ? 'https://chat-app-vyqv.onrender.com' 
      : 'http://localhost:5001', {
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('newMessage', (newMessage: Message) => {
      const { selectedUser } = get();
      if (selectedUser && 
          (newMessage.senderId === selectedUser._id || 
           newMessage.receiverId === selectedUser._id)) {
        set(state => ({ messages: [...state.messages, newMessage] }));
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
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load messages");
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
      if (messageData.text) formData.append('text', messageData.text);
      if (messageData.image) {
        // Convert base64 to blob if needed
        const blob = await fetch(messageData.image).then(r => r.blob());
        formData.append('file', blob);
      }

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      set(state => ({ messages: [...state.messages, res.data] }));
      
      // Notify via socket
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: selectedUser._id,
          message: res.data
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
    if (user) get().getMessages(user._id);
  }
}));