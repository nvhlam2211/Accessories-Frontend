import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ProductDetailSkeleton } from "../components/common/LoadingStates";
import { productService } from "../services/productService";
import type { Product } from "../types";
import { effectivePrice, formatCurrency, isOnSale } from "../utils/formatCurrency";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import "./ProductDetailPage.css";

export default function ProductDetailPage({ onAdd, onBuyNow }: { onAdd: (product: Product, quantity: number) => void; onBuyNow: (product: Product, quantity: number) => void }) {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    const productId = Number(id);
    setProduct(null);
    setError("");
    setQuantity(1);
    if (!Number.isInteger(productId) || productId < 1) {
      setError("Mã sản phẩm không hợp lệ.");
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    productService.get(productId)
      .then(result => {
        if (active) setProduct(result);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Không tải được sản phẩm.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) {
    return <main className="empty-state"><p>{error || "Không tìm thấy sản phẩm."}</p><Link to="/" className="text-link"><ArrowLeft size={16} /> Quay lại cửa hàng</Link></main>;
  }
  const onSale = isOnSale(product);

  return (
    <main className="detail-page section-wrap">
      <Link to="/" className="text-link"><ArrowLeft size={16} /> Cửa hàng</Link>
      <div className="detail-grid">
        <img className="detail-image" src={resolveImageUrl(product.imageUrl)} alt={product.name} />
        <div className="detail-info">
          <span className="eyebrow">MỘT MÓN XINH CỦA MÂY.</span>
          <h1>{product.name}</h1>
          <div className="detail-price">
            {formatCurrency(effectivePrice(product))}
            {onSale && <del>{formatCurrency(product.price)}</del>}
          </div>
          {onSale && <span className="detail-sale-label">GIẢM {Number(product.discountPercent)}%</span>}
          <p>{product.description}</p>
          <div className="detail-stock">{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng"}</div>
          <div className="detail-quantity">
            <span>Số lượng</span>
            <div className="detail-quantity-control">
              <button
                type="button"
                aria-label="Giảm số lượng"
                disabled={quantity <= 1}
                onClick={() => setQuantity(current => Math.max(1, current - 1))}
              >
                <Minus size={15} />
              </button>
              <input
                aria-label="Số lượng sản phẩm"
                type="number"
                min="1"
                max={product.stock}
                step="1"
                value={quantity}
                onChange={event => {
                  const value = event.target.value === "" ? 0 : Number(event.target.value);
                  setQuantity(Number.isFinite(value) ? Math.min(product.stock, Math.floor(value)) : 1);
                }}
                onBlur={() => setQuantity(current => Math.min(product.stock, Math.max(1, Math.floor(current))))}
              />
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity(current => Math.min(product.stock, current + 1))}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="detail-purchase-actions">
            <button className="button button-primary" disabled={product.stock < 1} onClick={() => onAdd(product, quantity)}>
              <ShoppingBag size={17} /> Thêm vào giỏ
            </button>
            <button className="button detail-buy-now" disabled={product.stock < 1} onClick={() => onBuyNow(product, quantity)}>
              <Zap size={17} /> Mua ngay
            </button>
          </div>
          <div className="detail-note">♡ Gói ghém xinh xắn · Giao hàng toàn quốc</div>
        </div>
      </div>
    </main>
  );
}
