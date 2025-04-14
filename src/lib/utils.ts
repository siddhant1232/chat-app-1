interface FormatMessageTimeOptions {
  hour: "2-digit";
  minute: "2-digit";
  hour12: boolean;
}

export function formatMessageTime(date: string | number | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  } as FormatMessageTimeOptions);
}