import { useState, type FormEvent, type KeyboardEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, X } from "lucide-react";

type AuthMode = "login" | "register";

export default function LoginPage({
  onClose,
  onPasswordSubmit,
  onGoogle,
  onError,
}: {
  onClose: () => void;
  onPasswordSubmit: (mode: AuthMode, name: string, email: string, password: string) => Promise<void>;
  onGoogle: (credential?: string) => void;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      await onPasswordSubmit(
        mode,
        String(data.get("name") ?? ""),
        String(data.get("email") ?? ""),
        String(data.get("password") ?? ""),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const currentMode = event.currentTarget.id === "auth-tab-login" ? "login" : "register";
    const nextMode = event.key === "Home" ? "login"
      : event.key === "End" ? "register"
      : event.key === "ArrowRight" ? currentMode === "login" ? "register" : "login"
      : currentMode === "login" ? "register" : "login";
    selectMode(nextMode);
    document.getElementById(`auth-tab-${nextMode}`)?.focus();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="login-modal" onClick={event => event.stopPropagation()}>
        <button className="modal-close icon-button" aria-label="Đóng" onClick={onClose}><X size={18} /></button>
        <div className="modal-flower">✿</div>
        <p className="eyebrow">RẤT VUI ĐƯỢC GẶP BẠN</p>
        <h2>{mode === "login" ? "Chào mừng bạn trở lại" : "Tạo tài khoản Mây."}</h2>
        <p>{mode === "login" ? "Đăng nhập để lưu giỏ hàng và khám phá những món phụ kiện xinh xắn." : "Đăng ký để lưu giỏ hàng và nhận thêm nhiều điều xinh xắn."}</p>
        <div className="auth-tabs" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
          <button
            id="auth-tab-login"
            type="button"
            role="tab"
            aria-controls="auth-panel"
            aria-selected={mode === "login"}
            tabIndex={mode === "login" ? 0 : -1}
            className={mode === "login" ? "active" : ""}
            onClick={() => selectMode("login")}
            onKeyDown={handleTabKeyDown}
          >Đăng nhập</button>
          <button
            id="auth-tab-register"
            type="button"
            role="tab"
            aria-controls="auth-panel"
            aria-selected={mode === "register"}
            tabIndex={mode === "register" ? 0 : -1}
            className={mode === "register" ? "active" : ""}
            onClick={() => selectMode("register")}
            onKeyDown={handleTabKeyDown}
          >Đăng ký</button>
        </div>
        <form className="auth-form" id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`} onSubmit={submit}>
          {mode === "register" && <label>Họ và tên<input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} placeholder="Tên của bạn" required /></label>}
          <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="ban@example.com" required /></label>
          <label>Mật khẩu<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} maxLength={72} placeholder={mode === "register" ? "Ít nhất 8 ký tự" : "Nhập mật khẩu"} required /></label>
          {error && <p className="inline-error auth-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"} <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-divider"><span>hoặc tiếp tục với</span></div>
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <p className="inline-error">Hãy cấu hình VITE_GOOGLE_CLIENT_ID trong file FE/.env trước.</p>
        ) : (
          <div className="auth-google-login">
            <GoogleLogin
              type="standard"
              text="signin_with"
              theme="outline"
              size="large"
              shape="pill"
              logo_alignment="left"
              width={String(Math.min(352, Math.max(220, window.innerWidth - 88)))}
              use_fedcm_for_button={false}
              onSuccess={response => onGoogle(response.credential)}
              onError={() => { onError("Không thể đăng nhập Google."); }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
