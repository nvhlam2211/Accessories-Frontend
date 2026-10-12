import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL || "#";
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || "#";
  const supportPhone = import.meta.env.VITE_SUPPORT_PHONE?.trim();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <section className="footer-about">
          <Link className="footer-brand" to="/">Mây Accessories</Link>
          <p>Chuyên cung cấp các mẫu kẹp tóc càng cua, kẹp bấm, nơ tiểu thư và phụ kiện phong cách Hàn Quốc ngọt ngào.</p>
        </section>
        <section className="footer-column">
          <h2>CHĂM SÓC KHÁCH HÀNG</h2>
          <p>Hotline / Zalo: {supportPhone ? <a className="footer-phone" href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}>{supportPhone}</a> : <span>Inbox Facebook để được tư vấn</span>}</p>
          <p>Giờ mở cửa: 08:30 - 21:30 hàng ngày</p>
          <p>Giao hàng toàn quốc &amp; đóng gói hộp quà xinh xắn</p>
        </section>
        <section className="footer-column footer-connect">
          <h2>KẾT NỐI VỚI CHÚNG MÌNH</h2>
          <p>Inbox trực tiếp để được tư vấn mẫu kẹp tóc phù hợp với khuôn mặt và trang phục nhé!</p>
          <div className="footer-social-links">
            <a className="footer-facebook-link" href={facebookUrl} target="_blank" rel="noreferrer"><Facebook size={15} fill="currentColor" /> Facebook</a>
            <a className="footer-instagram-link" href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a>
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Mây Accessories. All rights reserved.</span>
        <span>Kẹp tóc &amp; phụ kiện xinh · Giao hàng toàn quốc</span>
      </div>
    </footer>
  );
}
