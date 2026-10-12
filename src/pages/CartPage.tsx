import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CartSkeleton } from "../components/common/LoadingStates";
import type { CartItem } from "../types";
import { effectivePrice, formatCurrency, isOnSale } from "../utils/formatCurrency";
import { resolveImageUrl } from "../utils/resolveImageUrl";

export default function CartPage({
  items,
  loading,
  onChange,
  onRemove,
}: {
  items: CartItem[];
  loading: boolean;
  onChange: (item: CartItem, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const total = items.reduce((sum, item) => sum + effectivePrice(item.product) * item.quantity, 0);
  const regularItems = items.filter(item => !isOnSale(item.product));
  const saleItems = items.filter(item => isOnSale(item.product));

  function renderItem(item: CartItem) {
    const onSale = isOnSale(item.product);
    return (
      <article className="cart-row" key={item.id}>
        <img src={resolveImageUrl(item.product.imageUrl)} alt={item.product.name} />
        <div className="cart-row-info">
          <h3>{item.product.name}</h3>
          <p className={onSale ? "cart-price-sale" : ""}>
            {formatCurrency(effectivePrice(item.product))}
            {onSale && <del>{formatCurrency(item.product.price)}</del>}
          </p>
          {onSale && <span className="cart-discount-badge">Giảm {Number(item.product.discountPercent)}%</span>}
          <div className="quantity-control">
            <button onClick={() => onChange(item, item.quantity - 1)} aria-label="Giảm số lượng"><Minus size={14} /></button>
            <span>{item.quantity}</span>
            <button onClick={() => onChange(item, item.quantity + 1)} aria-label="Tăng số lượng"><Plus size={14} /></button>
          </div>
        </div>
        <button className="icon-button remove-button" aria-label="Xóa sản phẩm" onClick={() => onRemove(item.id)}><Trash2 size={17} /></button>
      </article>
    );
  }

  return (
    <main className="cart-page section-wrap">
      <span className="eyebrow">MÓN XINH BẠN ĐÃ CHỌN</span>
      <h1>Giỏ hàng <em>của bạn</em></h1>
      {loading ? <CartSkeleton /> : items.length === 0 ? (
        <div className="empty-products"><span>♡</span><h3>Giỏ hàng đang chờ điều xinh xắn</h3><p>Chọn món phụ kiện yêu thích và thêm vào giỏ nhé.</p><Link className="button button-primary" to="/">Tiếp tục mua sắm <ArrowRight size={16} /></Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {regularItems.length > 0 && (
              <section className="cart-group">
                <h2>Sản phẩm thường<span>{regularItems.length}</span></h2>
                {regularItems.map(renderItem)}
              </section>
            )}
            {saleItems.length > 0 && (
              <section className="cart-group cart-group-sale">
                <h2>Sản phẩm đang sale <span>{saleItems.length}</span></h2>
                {saleItems.map(renderItem)}
              </section>
            )}
          </div>
          <aside className="cart-summary">
            <h2>Tạm tính</h2>
            <div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</span><b>{formatCurrency(total)}</b></div>
            <p>Phí vận chuyển sẽ được xác nhận khi bạn liên hệ đặt hàng.</p>
            <a className="button button-primary" href={import.meta.env.VITE_FACEBOOK_URL || "#"} target="_blank" rel="noreferrer">Liên hệ đặt hàng <ArrowRight size={16} /></a>
          </aside>
        </div>
      )}
    </main>
  );
}
