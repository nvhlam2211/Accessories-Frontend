import "./LoadingStates.css";

export function LoadingIndicator({ label }: { label: string }) {
  return (
    <div className="loading-indicator" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <div className="product-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <article className="loading-product-card" key={index}>
            <div className="loading-shimmer loading-product-image" />
            <div className="loading-product-info">
              <div className="loading-shimmer loading-product-name" />
              <div className="loading-shimmer loading-product-price" />
              <div className="loading-product-actions">
                <div className="loading-shimmer loading-buy-button" />
                <div className="loading-shimmer loading-add-button" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="visually-hidden" role="status">Đang tải sản phẩm...</p>
    </>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main className="detail-page section-wrap">
      <div className="loading-shimmer loading-detail-back" aria-hidden="true" />
      <div className="loading-detail-grid" aria-hidden="true">
        <div className="loading-shimmer loading-detail-image" />
        <div className="loading-detail-info">
          <div className="loading-shimmer loading-detail-eyebrow" />
          <div className="loading-shimmer loading-detail-title" />
          <div className="loading-shimmer loading-detail-price" />
          <div className="loading-shimmer loading-detail-copy" />
          <div className="loading-shimmer loading-detail-copy loading-detail-copy-short" />
          <div className="loading-detail-actions">
            <div className="loading-shimmer loading-detail-button" />
            <div className="loading-shimmer loading-detail-button" />
          </div>
        </div>
      </div>
      <p className="visually-hidden" role="status">Đang tải thông tin sản phẩm...</p>
    </main>
  );
}

export function CartSkeleton() {
  return (
    <>
      <div className="loading-cart-layout" aria-hidden="true">
        <div className="loading-cart-items">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="loading-cart-row" key={index}>
              <div className="loading-shimmer loading-cart-image" />
              <div className="loading-cart-copy">
                <div className="loading-shimmer loading-cart-title" />
                <div className="loading-shimmer loading-cart-price" />
                <div className="loading-shimmer loading-cart-quantity" />
              </div>
            </div>
          ))}
        </div>
        <aside className="loading-shimmer loading-cart-summary" />
      </div>
      <p className="visually-hidden" role="status">Đang tải giỏ hàng...</p>
    </>
  );
}

export function AdminProductsSkeleton() {
  return (
    <>
      <div className="loading-admin-products" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="loading-admin-row" key={index}>
            <div className="loading-shimmer loading-admin-image" />
            <div className="loading-admin-copy">
              <div className="loading-shimmer loading-admin-name" />
              <div className="loading-shimmer loading-admin-stock" />
            </div>
            <div className="loading-shimmer loading-admin-action" />
          </div>
        ))}
      </div>
      <p className="visually-hidden" role="status">Đang tải kho hàng...</p>
    </>
  );
}
