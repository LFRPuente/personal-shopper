const STORAGE_KEY = 'home_priority_request_ids';

const readPriorityIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

export const getPriorityRequestIds = () => new Set(readPriorityIds());

export const togglePriorityRequestId = (requestId) => {
  const ids = getPriorityRequestIds();
  const key = String(requestId);
  ids.has(key) ? ids.delete(key) : ids.add(key);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }
  return ids;
};
