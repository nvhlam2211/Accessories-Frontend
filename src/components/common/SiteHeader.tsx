import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Facebook, Heart, Instagram, Menu, Moon, Search, ShieldCheck, ShoppingCart, Sun, UserRound, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../types";

type HeaderUser = {
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";
};

type SiteHeaderProps = {
  user: HeaderUser | null;
  cartCount: number;
  darkMode: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleDarkMode: () => void;
};

export default function SiteHeader({
  user,
  cartCount,
  darkMode,
  onSignIn,
  onSignOut,
  onToggleDarkMode,
}: SiteHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState(new URLSearchParams(location.search).get("search") ?? "");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionError, setSuggestionError] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.name;
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    setSearchText(new URLSearchParams(location.search).get("search") ?? "");
    setMobileMenuOpen(false);
  }, [location.search]);

  useEffect(() => {
    const query = searchText.trim();
    setActiveSuggestionIndex(-1);
    if (!query) {
      setSuggestions([]);
      setSuggestionError("");
      setSuggestionsLoading(false);
      return;
    }

    let active = true;
    setSuggestionsLoading(true);
    const timer = window.setTimeout(() => {
      productService.list("?limit=100")
        .then(products => {
          if (!active) return;
          const normalizedQuery = normalizeSearchText(query);
          const matches = products.filter(product => normalizeSearchText(product.name).includes(normalizedQuery));
          setSuggestions(matches.slice(0, 5));
          setSuggestionError("");
          setSuggestionsLoading(false);
        })
        .catch(cause => {
          if (!active) return;
          setSuggestions([]);
          setSuggestionError(cause instanceof Error ? cause.message : "Không tải được gợi ý sản phẩm.");
          setSuggestionsLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchText]);

  function normalizeSearchText(value: string) {
    return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  }

  function handleHomeClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function searchProducts(query = searchText) {
    const trimmedQuery = query.trim();
    setSearchText(trimmedQuery);
    setSuggestionsOpen(false);
    setMobileMenuOpen(false);
    navigate(trimmedQuery ? `/?search=${encodeURIComponent(trimmedQuery)}#collection` : "/");
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
      searchProducts(suggestions[activeSuggestionIndex].name);
      return;
    }
    searchProducts();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!suggestionsOpen || !suggestions.length) return;
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestionIndex(current => {
        if (event.key === "ArrowDown") return current >= suggestions.length - 1 ? 0 : current + 1;
        return current <= 0 ? suggestions.length - 1 : current - 1;
      });
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      event.preventDefault();
      searchProducts(suggestions[activeSuggestionIndex].name);
    }
  }

  return (
    <header className={`site-header${isStaff ? " site-header--staff" : ""}`}>
      <Link className="brand" to="/" onClick={handleHomeClick} aria-label="Mây Accessories - về trang chủ">
        <span className="brand-mark"><Heart size={19} fill="currentColor" /></span>
        <span className="brand-copy">
          <strong>Mây Accessories</strong>
          <small>KẸP TÓC &amp; PHỤ KIỆN XINH</small>
        </span>
      </Link>
      <div className="header-discovery">
        <nav className="header-nav" aria-label="Điều hướng chính">
          <Link to="/" onClick={handleHomeClick}>Trang chủ</Link>
          <a href="/#collection">Sản phẩm</a>
          <a href="/#story">Giới thiệu</a>
        </nav>
        <form className="header-search" role="search" onSubmit={submitSearch} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}>
        <label>
          <span className="visually-hidden">Tìm theo tên sản phẩm</span>
          <input
            value={searchText}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={event => {
              setSearchText(event.target.value);
              setSuggestionsOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm sản phẩm..."
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen && Boolean(searchText.trim())}
            aria-activedescendant={activeSuggestionIndex >= 0 ? `product-suggestion-${suggestions[activeSuggestionIndex]?.id}` : undefined}
          />
        </label>
        <button type="submit" aria-label="Tìm kiếm sản phẩm" title="Tìm kiếm">
          <Search size={16} />
        </button>
        {suggestionsOpen && searchText.trim() && (suggestionsLoading || suggestionError || suggestions.length > 0) && (
          <div className="header-search-suggestions" role="listbox" aria-label="Gợi ý sản phẩm">
            {suggestionsLoading
              ? <p className="header-search-suggestion-message" role="status">Đang tìm sản phẩm...</p>
              : suggestionError
                ? <p className="header-search-suggestion-error" role="status">{suggestionError}</p>
                : suggestions.map(product => (
                <button
                  className={`header-search-suggestion${activeSuggestionIndex === suggestions.indexOf(product) ? " active" : ""}`}
                  type="button"
                  role="option"
                  id={`product-suggestion-${product.id}`}
                  aria-selected={activeSuggestionIndex === suggestions.indexOf(product)}
                  key={product.id}
                  onMouseEnter={() => setActiveSuggestionIndex(suggestions.indexOf(product))}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => searchProducts(product.name)}
                >
                  {product.name}
                </button>
                ))}
          </div>
        )}
        </form>
      </div>
      <div className="header-actions">
        <button
          className="header-theme-toggle"
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? "Bật giao diện sáng" : "Bật giao diện tối"}
          title={darkMode ? "Bật giao diện sáng" : "Bật giao diện tối"}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <a className="social-icon facebook-icon" href={import.meta.env.VITE_FACEBOOK_URL || "#"} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} fill="currentColor" /></a>
        <a className="social-icon instagram-icon" href={import.meta.env.VITE_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
        {user ? (
          <>
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                className="admin-link"
                to="/admin"
                aria-label="Quản lý shop"
                title="Quản lý shop"
              >
                <ShieldCheck size={15} />
                <span className="admin-link-label">Quản lý shop</span>
                <span className="admin-link-compact">Quản lý</span>
              </Link>
            )}
            <Link className="profile-link" to="/profile" aria-label="Hồ sơ người dùng">
              <img className="user-avatar" src="/favicon.png" alt="" aria-hidden="true" />
              <span className="user-greeting">{displayName}</span>
              <UserRound className="profile-link-icon" size={16} />
            </Link>
            <button className="logout-button" onClick={onSignOut}>Đăng xuất</button>
          </>
        ) : (
          <button className="text-button" onClick={onSignIn}>Đăng nhập</button>
        )}
        <Link className="bag-button" to="/cart" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
          <ShoppingCart size={19} /><span>{cartCount}</span>
        </Link>
      </div>
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMobileMenuOpen(open => !open)}
      >
        {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {mobileMenuOpen && (
        <div className="mobile-navigation" id="mobile-navigation">
          <details className="mobile-navigation-group" open>
            <summary>Điều hướng</summary>
            <nav aria-label="Điều hướng di động">
              <Link to="/" onClick={() => { handleHomeClick(); closeMobileMenu(); }}>Trang chủ</Link>
              <a href="/#collection" onClick={closeMobileMenu}>Sản phẩm</a>
              <a href="/#story" onClick={closeMobileMenu}>Giới thiệu</a>
            </nav>
          </details>
          <details className="mobile-navigation-group">
            <summary>Tài khoản</summary>
            <div className="mobile-navigation-links">
              {user ? (
                <>
                  <span className="mobile-navigation-user">Xin chào, {displayName}</span>
                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Link to="/admin" onClick={closeMobileMenu}><ShieldCheck size={16} />Quản lý shop</Link>}
                  <Link to="/profile" onClick={closeMobileMenu}><UserRound size={16} />Hồ sơ của tôi</Link>
                  <button type="button" onClick={() => { closeMobileMenu(); onSignOut(); }}>Đăng xuất</button>
                </>
              ) : (
                <button type="button" onClick={() => { closeMobileMenu(); onSignIn(); }}>Đăng nhập / Đăng ký</button>
              )}
            </div>
          </details>
          <details className="mobile-navigation-group">
            <summary>Giao diện</summary>
            <div className="mobile-navigation-links">
              <button type="button" onClick={onToggleDarkMode}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}{darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}</button>
            </div>
          </details>
          <details className="mobile-navigation-group">
            <summary>Kết nối với Mây</summary>
            <div className="mobile-navigation-links">
              <a href={import.meta.env.VITE_FACEBOOK_URL || "#"} target="_blank" rel="noreferrer" onClick={closeMobileMenu}><Facebook size={16} />Facebook</a>
              <a href={import.meta.env.VITE_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer" onClick={closeMobileMenu}><Instagram size={16} />Instagram</a>
            </div>
          </details>
        </div>
      )}
    </header>
  );
}
