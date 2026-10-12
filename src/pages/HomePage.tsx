import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Gift, Heart, Search, Sparkles, Truck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ProductCard } from "../components/common/ProductCard";
import { ProductGridSkeleton } from "../components/common/LoadingStates";
import { productService } from "../services/productService";
import type { Product } from "../types";
import { isOnSale } from "../utils/formatCurrency";

export default function HomePage({ onAdd, onBuyNow }: { onAdd: (product: Product) => void; onBuyNow: (product: Product) => void }) {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const searchQuery = new URLSearchParams(location.search).get("search") ?? "";
  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    return products.filter(product => {
      const normalizedName = product.name.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
      return !normalizedQuery || normalizedName.includes(normalizedQuery);
    });
  }, [products, searchQuery]);
  const saleProducts = filteredProducts.filter(isOnSale);
  const regularProducts = filteredProducts.filter(product => !isOnSale(product));

  useEffect(() => {
    if (!searchQuery || location.hash !== "#collection" || loading) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, location.hash, searchQuery]);

  useEffect(() => {
    let active = true;
    const loadProducts = () => {
      productService.list("?limit=100")
        .then(result => {
          if (!active) return;
          setProducts(result);
          setError("");
        })
        .catch(cause => {
          if (active) setError(cause instanceof Error ? cause.message : "Không tải được sản phẩm.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadProducts();
    };

    loadProducts();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return (
    <main>
      <section className="hero banner-hero">
        <div className="hero-copy banner-copy">
          <span className="hero-kicker"><Sparkles size={15} /> MỘT CHÚT XINH, CẢ NGÀY VUI</span>
          <h1>Điểm xinh cho nàng,<br />nhẹ nhàng như <em>mây.</em></h1>
          <p>Khám phá những chiếc kẹp tóc và phụ kiện nhỏ xinh, dịu dàng dành riêng cho bạn.</p>
          <a className="button button-primary banner-cta" href="#collection">
            Khám phá bộ sưu tập <ArrowRight size={17} />
          </a>
          <div className="hero-love-note"><span><Heart size={15} fill="currentColor" /></span> Chọn món mình yêu, xinh theo cách riêng.</div>
        </div>
        <div className="banner-art">
          <img src="/images/may-banner.png" alt="May Accessories - phụ kiện tóc và kẹp tóc xinh xắn" />
          <span className="banner-art-badge"><span>♡</span> Xinh xắn mỗi ngày</span>
        </div>
      </section>
      <section className="perks">
        <div><span><Sparkles size={22} /></span><p><b>Nhỏ xinh, dễ thương</b><br />Chọn lọc từng món phụ kiện</p></div>
        <div><span><Gift size={22} /></span><p><b>Gói ghém thật xinh</b><br />Trao gửi bằng cả yêu thương</p></div>
        <div><span><Truck size={22} /></span><p><b>Giao hàng toàn quốc</b><br />Mang điều xinh đến mọi nơi</p></div>
      </section>
      <section className="collection section-wrap" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">ĐƯỢC CHỌN RIÊNG CHO BẠN</span><h2>Góc nhỏ <em>đáng yêu</em></h2><p className="section-subtitle">Tìm thấy món phụ kiện khiến bạn mỉm cười.</p></div>
          <span className="product-count">{loading ? "ĐANG TẢI..." : `${filteredProducts.length.toString().padStart(2, "0")} MÓN XINH`}</span>
        </div>
        {loading ? <ProductGridSkeleton /> : error ? <div className="empty-state">{error}</div> : products.length === 0 ? (
          <div className="empty-products"><span className="empty-products-icon"><Heart size={27} /></span><h3>Sắp có những món thật xinh!</h3><p>Những chiếc kẹp tóc đáng yêu đang được chuẩn bị để gặp bạn.</p><a className="text-link" href="#collection">Ghé lại xem bộ sưu tập <ArrowRight size={15} /></a></div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-products"><span className="empty-products-icon"><Search size={27} /></span><h3>Chưa tìm thấy sản phẩm phù hợp</h3><p>Thử tìm bằng tên sản phẩm khác nhé.</p></div>
        ) : (
          <>
            {regularProducts.length > 0 && (
              <section className="product-group" aria-labelledby="regular-products-heading">
                <div className="product-group-heading">
                  <h3 id="regular-products-heading">Sản phẩm sẵn có</h3>
                  <span className="product-count">{regularProducts.length} sản phẩm</span>
                </div>
                <div className="product-grid">
                  {regularProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} onAdd={onAdd} onBuyNow={onBuyNow} index={index} />
                  ))}
                </div>
              </section>
            )}
            {saleProducts.length > 0 && (
              <section className="product-group product-group-sale" aria-labelledby="sale-products-heading">
                <div className="product-group-heading">
                  <h3 id="sale-products-heading">Sản phẩm đang sale</h3>
                  <span className="product-count">{saleProducts.length} sản phẩm</span>
                </div>
                <div className="product-grid">
                  {saleProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} onAdd={onAdd} onBuyNow={onBuyNow} index={index} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
      <section className="story section-wrap" id="story">
        <div className="story-image"><img src="/images/story-accessories.png" alt="Phụ kiện tóc thủ công trang trí bằng vỏ sò và nơ" /></div>
        <div className="story-copy"><span className="eyebrow">LỜI NHẮN TỪ MÂY ACCESSORIES</span><h2>Niềm vui đôi khi<br />đến từ điều <em>bé xíu.</em></h2><p>Mây Accessories tin rằng những điều nhỏ xinh cũng có thể làm một ngày trở nên đặc biệt. Mỗi chiếc kẹp được chọn với mong muốn mang đến cho bạn một chút vui tươi và thật nhiều tự tin.</p><a className="text-link" href="#collection">Tìm món xinh cho mình <ArrowRight size={16} /></a></div>
        <span className="story-doodle">♡</span>
      </section>
    </main>
  );
}
