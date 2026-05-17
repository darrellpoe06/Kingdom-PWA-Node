// Shim for the prototype's window.storage API, backed by localStorage.
// Contract derived from the prototype's call sites:
//   await window.storage.get(key)        -> { value: string } | null
//   await window.storage.set(key, value) -> void   (value is a string)
export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};
