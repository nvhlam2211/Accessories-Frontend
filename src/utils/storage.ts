export function readJson<T>(key: string, fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue === null ? fallback : JSON.parse(storedValue) as T;
  } catch (error) {
    console.warn("Không thể đọc dữ liệu từ localStorage:", error);
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Không thể lưu dữ liệu vào localStorage:", error);
  }
}
