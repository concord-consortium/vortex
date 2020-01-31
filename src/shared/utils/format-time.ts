const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true
};

export const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString("en-US", dateOptions);
