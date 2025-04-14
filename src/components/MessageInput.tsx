import { useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE_MB = 5; // 5MB maximum file size

const MessageInput = () => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText && !selectedFile) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsSending(true);
    try {
      const imageBase64 = selectedFile
        ? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Failed to convert image to base64"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          })
        : undefined;

      await sendMessage({
        text: trimmedText,
        image: imageBase64, // Pass base64 string
      });

      // Reset form on success
      setText("");
      removeImage();
    } catch (error) {
      console.error("Message send error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 w-full bg-base-100 border-t border-base-300">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-base-300 flex items-center justify-center border border-base-200 hover:bg-error hover:text-error-content transition-colors"
              type="button"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="flex-1 input input-bordered rounded-lg input-sm"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
          />
          
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isSending}
          />
          
          <button
            type="button"
            className={`btn btn-circle btn-sm ${imagePreview ? "btn-success" : "btn-ghost"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach image"
          >
            <Image size={18} />
          </button>
        </div>
        
        <button
          type="submit"
          className="btn btn-circle btn-sm btn-primary"
          disabled={(!text.trim() && !selectedFile) || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;