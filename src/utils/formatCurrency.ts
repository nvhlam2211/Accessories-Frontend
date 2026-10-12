export function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function effectivePrice(product: { price: string | number; discountPercent?: string | number | null }): number {
  const discountPercent = Number(product.discountPercent ?? 0);
  return discountPercent > 0 && discountPercent < 100
    ? Number(product.price) * (1 - discountPercent / 100)
    : Number(product.price);
}

export function isOnSale(product: { discountPercent?: string | number | null }): boolean {
  const discountPercent = Number(product.discountPercent ?? 0);
  return discountPercent > 0 && discountPercent < 100;
}
