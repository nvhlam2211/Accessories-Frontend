import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../../types";
import { effectivePrice, formatCurrency, isOnSale } from "../../utils/formatCurrency";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import "./ProductCard.css";

export function ProductCard({
  product,
  onAdd,
  onBuyNow,
  index,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  index: number;
}) {
  const onSale = isOnSale(product);
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <article className="product-card" style={{ animationDelay: `${index * 70}ms` }}>
      <Link to={`/san-pham/${product.id}`} className="product-image">
        {!imageLoaded && <span className="product-image-loading loading-shimmer" aria-hidden="true" />}
        <img
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        <span className={`product-tag${onSale ? " product-tag-sale" : ""}`}>
          {onSale ? `-${Number(product.discountPercent)}%` : "xinh mới"}
        </span>
        <span className="quick-view">Xem chi tiết <ArrowRight size={14} /></span>
      </Link>
      <div className="product-info">
        <div className="product-price-info">
          <Link to={`/san-pham/${product.id}`} className="product-name">{product.name}</Link>
          <p className={onSale ? "product-price-sale" : ""}>
            {formatCurrency(effectivePrice(product))}
            {onSale && <del>{formatCurrency(product.price)}</del>}
          </p>
        </div>
        <div className="product-card-actions">
          <button className="product-buy-now" onClick={() => onBuyNow(product)}>Mua ngay</button>
          <button
            className="product-add-to-cart"
            onClick={() => onAdd(product)}
          >
            Thêm giỏ hàng
          </button>
        </div>
      </div>
    </article>
  );
}
