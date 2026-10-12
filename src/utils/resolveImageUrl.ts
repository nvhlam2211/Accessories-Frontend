const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/uploads/")) return `${apiBaseUrl}${imageUrl}`;
  return imageUrl;
}
