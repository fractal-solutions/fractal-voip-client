export const loadData = (key, fallback) => {
  try {
    const d = localStorage.getItem("softphone_" + key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
};

export const saveData = (key, value) => {
  try {
    localStorage.setItem("softphone_" + key, JSON.stringify(value));
  } catch {}
};
