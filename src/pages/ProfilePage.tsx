import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "../types";

export default function ProfilePage({
  user,
  loading,
  onSignIn,
  onChangePassword,
  onNotice,
}: {
  user: User | null;
  loading: boolean;
  onSignIn: () => void;
  onChangePassword: (currentPassword: string | undefined, newPassword: string) => Promise<User>;
  onNotice: (message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [user?.id]);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onChangePassword(user?.hasPassword ? currentPassword : undefined, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onNotice(user?.hasPassword ? "Đã đổi mật khẩu thành công." : "Đã tạo mật khẩu đăng nhập thành công.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="profile-page section-wrap"><p className="profile-status">Đang tải hồ sơ...</p></main>;
  }

  if (!user) {
    return (
      <main className="profile-page section-wrap">
        <div className="profile-card profile-gate">
          <span className="profile-icon"><UserRound size={25} /></span>
          <h1>Hồ sơ <em>của bạn</em></h1>
          <p>Đăng nhập để xem thông tin tài khoản.</p>
          <button className="button button-primary" onClick={onSignIn}>Đăng nhập <ArrowRight size={16} /></button>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page section-wrap">
      <span className="eyebrow">TÀI KHOẢN CỦA BẠN</span>
      <h1>Hồ sơ <em>người dùng</em></h1>
      <div className="profile-card">
        <div className="profile-card-heading">
          <span className="profile-icon"><UserRound size={25} /></span>
          <div><h2>Thông tin cá nhân</h2><p>Thông tin tài khoản của bạn.</p></div>
        </div>
        <div className="profile-details">
          <div><span>Họ và tên</span><b>{user.name}</b></div>
          <div><span>Email</span><b>{user.email}</b></div>
          <div className="profile-role"><span>Loại tài khoản</span><b>{user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}</b></div>
        </div>
      </div>
      <div className="profile-card password-card">
        <div className="profile-card-heading">
          <span className="profile-icon"><KeyRound size={23} /></span>
          <div>
            <h2>{user.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}</h2>
            <p>{user.hasPassword ? "Nhập mật khẩu hiện tại và mật khẩu mới." : "Tạo mật khẩu để có thể đăng nhập bằng email."}</p>
          </div>
        </div>
        <form className="profile-form" onSubmit={savePassword}>
          {user.hasPassword && (
            <label>
              Mật khẩu hiện tại
              <input
                autoComplete="current-password"
                maxLength={72}
                onChange={event => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
            </label>
          )}
          <label>
            Mật khẩu mới
            <input
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              onChange={event => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>
          <label>
            Xác nhận mật khẩu mới
            <input
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              onChange={event => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <div className="profile-actions">
            <Link className="text-link" to="/">Quay lại cửa hàng</Link>
            <button className="button button-primary" disabled={saving}>
              {saving ? "Đang lưu..." : user.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
