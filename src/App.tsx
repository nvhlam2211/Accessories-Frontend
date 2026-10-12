import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Swal from "sweetalert2";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import SiteHeader from "./components/common/SiteHeader";
import SiteFooter from "./components/common/SiteFooter";
import Chatbot from "./components/common/Chatbot";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import type { Product } from "./types";
import { confirmBuyNow } from "./utils/buyNow";

function AppContent() {
  const { user, loading: authLoading, error: authError, login, register, loginWithGoogle, changePassword, logout } = useAuth();
  const { items, loading: cartLoading, error: cartError, add, setQuantity, remove } = useCart();
  const [notice, setNotice] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem("may-accessories-theme");
      if (savedTheme) return savedTheme === "dark";
    } catch {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const navigate = useNavigate();

  function showNotice(message: string) {
    setNotice(message);
  }

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try {
      window.localStorage.setItem("may-accessories-theme", darkMode ? "dark" : "light");
    } catch {
      // The theme still applies for this session if storage is unavailable.
    }
  }, [darkMode]);

  useEffect(() => {
    if (authError) showNotice(authError);
  }, [authError]);

  useEffect(() => {
    if (cartError) showNotice(cartError);
  }, [cartError]);

  async function addToCart(product: Product, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      showCartError("Vui lòng chọn số lượng hợp lệ.");
      return;
    }
    if (quantity > product.stock) {
      showCartError(`Hiện tại shop chỉ còn ${product.stock} sản phẩm.`);
      return;
    }
    if (!user) {
      setLoginOpen(true);
      return;
    }
    try {
      await add(product, quantity);
      showNotice(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
    } catch (cause) {
      showCartError(cause instanceof Error ? cause.message : "Không thể thêm vào giỏ.");
    }
  }

  function showCartError(message: string) {
    void Swal.fire({
      toast: true,
      position: "top",
      icon: "warning",
      title: message,
      showConfirmButton: false,
      timer: 3200,
      timerProgressBar: true,
      width: "min(92vw, 380px)",
      customClass: { popup: "may-stock-toast" },
    });
  }

  function buyNow(product: Product, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      showCartError("Vui lòng chọn số lượng hợp lệ.");
      return;
    }
    if (quantity > product.stock) {
      showCartError(`Hiện tại shop chỉ còn ${product.stock} sản phẩm.`);
      return;
    }
    void confirmBuyNow(product, quantity);
  }

  async function signOut() {
    try {
      await logout();
      navigate("/");
      showNotice("Bạn đã đăng xuất.");
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : "Không thể đăng xuất.");
    }
  }

  async function handlePasswordAuth(mode: "login" | "register", name: string, email: string, password: string) {
    const signedIn = mode === "register"
      ? await register(name, email, password)
      : await login(email, password);
    setLoginOpen(false);
    showNotice(`Xin chào ${signedIn.name}!`);
  }

  async function handleGoogleLogin(credential?: string) {
    if (!credential) {
      showNotice("Đăng nhập Google không thành công.");
      return;
    }
    try {
      const signedIn = await loginWithGoogle(credential);
      setLoginOpen(false);
      showNotice(`Xin chào ${signedIn.name}!`);
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : "Đăng nhập thất bại.");
    }
  }

  return (
    <>
      <SiteHeader
        user={user}
        cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
        darkMode={darkMode}
        onSignIn={() => setLoginOpen(true)}
        onSignOut={() => void signOut()}
        onToggleDarkMode={() => setDarkMode(current => !current)}
      />
      <Routes>
        <Route path="/" element={<HomePage onAdd={product => void addToCart(product)} onBuyNow={product => buyNow(product)} />} />
        <Route path="/san-pham/:id" element={<ProductDetailPage onAdd={(product, quantity) => void addToCart(product, quantity)} onBuyNow={(product, quantity) => buyNow(product, quantity)} />} />
        <Route path="/profile" element={<ProfilePage user={user} loading={authLoading} onSignIn={() => setLoginOpen(true)} onChangePassword={changePassword} onNotice={showNotice} />} />
        <Route path="/cart" element={<CartPage items={items} loading={cartLoading} onChange={(item, quantity) => void setQuantity(item, quantity).catch(cause => showNotice(cause instanceof Error ? cause.message : "Không thể cập nhật giỏ."))} onRemove={id => void remove(id).catch(cause => showNotice(cause instanceof Error ? cause.message : "Không thể xóa sản phẩm."))} />} />
        <Route path="/admin" element={<AdminPage user={user} loading={authLoading} onNotice={showNotice} />} />
        <Route path="*" element={<main className="empty-state"><h1>Trang này chưa có ở đây</h1><Link className="button button-primary" to="/">Về trang chủ</Link></main>} />
      </Routes>
      <SiteFooter />
      <Chatbot onAdd={product => void addToCart(product)} />
      {notice && <div className="toast"><Check size={17} />{notice}</div>}
      {loginOpen && (
        <LoginPage
          onClose={() => setLoginOpen(false)}
          onPasswordSubmit={handlePasswordAuth}
          onGoogle={credential => void handleGoogleLogin(credential)}
          onError={showNotice}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
