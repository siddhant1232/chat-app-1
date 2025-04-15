// src/components/MessagingInput
import { useRef, useState, useCallback, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_MB = 5;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, initializeSocket, disconnectSocket } = useChatStore();

  // Initialize socket when component mounts
  useEffect(() => {
    initializeSocket();
    return () => disconnectSocket();
  }, [initializeSocket, disconnectSocket]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const imageFile = fileInputRef.current?.files?.[0];
    const hasContent = text.trim() || imageFile || imagePreview;
    
    if (!hasContent) {
      toast.error("Please enter a message");
      return;
    }
  
    setIsSending(true);
    try {
      await sendMessage({
        text: text.trim(), // Ensure text is properly passed
        image: imageFile || imagePreview || undefined,
      });
      
      // Reset form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="p-4 w-full bg-base-100 border-t border-base-300">
      {imagePreview && (
        <div className="mb-3 relative w-20 h-20">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg border"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
            type="button"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 input input-bordered input-sm"
          disabled={isSending}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
          disabled={isSending}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-circle btn-sm btn-ghost"
          disabled={isSending}
        >
          <Image size={18} />
        </button>
        
        <button
          type="submit"
          className="btn btn-circle btn-sm btn-primary"
          disabled={isSending || (!text.trim() && !imagePreview)}
        >
          {isSending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;