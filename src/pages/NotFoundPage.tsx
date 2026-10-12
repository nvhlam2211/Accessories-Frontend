import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const canGoBack = window.history.length > 1;

  function goBack() {
    if (canGoBack) navigate(-1);
    else navigate("/", { replace: true });
  }

  return (
    <main className="not-found-page">
      <span className="not-found-code">404</span>
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn đang tìm không tồn tại hoặc không khả dụng.</p>
      <button className="button button-primary" onClick={goBack}>
        {canGoBack ? <ArrowLeft size={16} /> : <Home size={16} />}
        {canGoBack ? "Quay lại trang trước" : "Về trang chủ"}
      </button>
    </main>
  );
}
