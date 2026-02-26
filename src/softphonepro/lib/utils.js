export const generateId = () => "_" + Math.random().toString(36).substr(2, 9);

export const formatDuration = seconds => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export const formatRelativeTime = timestamp => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return then.toLocaleDateString();
};

export const getInitials = name => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const avatarColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

export const getAvatarColor = name =>
  avatarColors[Math.abs((name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length];
