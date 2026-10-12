import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Ban, Boxes, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { AdminProductsSkeleton, LoadingIndicator } from "../components/common/LoadingStates";
import { adminService } from "../services/adminService";
import { productService } from "../services/productService";
import type { PageAdminAccount, Product, RevenueReport, SaleRecord, User } from "../types";
import { effectivePrice, formatCurrency, isOnSale } from "../utils/formatCurrency";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import { confirmDeletePageAdmin, confirmDeleteProduct, promptSaleReason } from "../utils/adminDialogs";
import NotFoundPage from "./NotFoundPage";
import "./AdminPage.css";

export default function AdminPage({ user, loading: authLoading, onNotice }: { user: User | null; loading: boolean; onNotice: (message: string) => void }) {
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesLoadingMore, setSalesLoadingMore] = useState(false);
  const [salesPage, setSalesPage] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesTotalCompleted, setSalesTotalCompleted] = useState(0);
  const [salesTotalVoided, setSalesTotalVoided] = useState(0);
  const [salesFilter, setSalesFilter] = useState<"COMPLETED" | "VOIDED">("COMPLETED");
  const [pageAdmins, setPageAdmins] = useState<PageAdminAccount[]>([]);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminOwnerNote, setNewAdminOwnerNote] = useState("");
  const [editingAdminNoteId, setEditingAdminNoteId] = useState<string | null>(null);
  const [editingAdminNote, setEditingAdminNote] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState("");
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [saleEditError, setSaleEditError] = useState("");
  const [saleEditLoading, setSaleEditLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportError, setReportError] = useState("");
  const [salesError, setSalesError] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await productService.listAdmin());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được sản phẩm.");
      throw cause;
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setReport(await adminService.reports());
    } catch (cause) {
      setReportError(cause instanceof Error ? cause.message : "Không tải được báo cáo doanh thu.");
      throw cause;
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const result = await adminService.sales();
      setSales(result.data);
      setSalesPage(result.meta.page);
      setSalesTotal(result.meta.total);
      setSalesTotalCompleted(result.meta.totalCompleted);
      setSalesTotalVoided(result.meta.totalVoided);
    } catch (cause) {
      setSalesError(cause instanceof Error ? cause.message : "Không tải được lịch sử giao dịch.");
      throw cause;
    } finally {
      setSalesLoading(false);
    }
  }, []);

  async function loadMoreSales() {
    if (salesLoadingMore || sales.length >= salesTotal) return;
    setSalesLoadingMore(true);
    setSalesError("");
    try {
      const result = await adminService.sales(salesPage + 1);
      setSales(current => [...current, ...result.data]);
      setSalesPage(result.meta.page);
      setSalesTotal(result.meta.total);
      setSalesTotalCompleted(result.meta.totalCompleted);
      setSalesTotalVoided(result.meta.totalVoided);
    } catch (cause) {
      setSalesError(cause instanceof Error ? cause.message : "Không tải thêm được lịch sử giao dịch.");
    } finally {
      setSalesLoadingMore(false);
    }
  }

  const loadPageAdmins = useCallback(async () => {
    try {
      setPageAdmins(await adminService.pageAdmins());
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : "Không tải được tài khoản quản trị.");
      throw cause;
    }
  }, []);

  const refreshAdminData = useCallback(
    () => Promise.all([
      loadProducts(),
      loadReports(),
      loadSales(),
      ...(isSuperAdmin ? [loadPageAdmins()] : []),
    ]).then(() => undefined),
    [isSuperAdmin, loadPageAdmins, loadProducts, loadReports, loadSales],
  );

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      void refreshAdminData().catch(() => undefined);
    }
  }, [user, refreshAdminData]);

  const selectedProduct = products.find(product => String(product.id) === selectedProductId);

  useEffect(() => {
    if (!selectedProduct) return;
    setSalePrice(String(effectivePrice(selectedProduct)));
  }, [selectedProduct]);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setError("");
    try {
      const result = editing
        ? await productService.update(editing.id, data)
        : await productService.create(data);
      form.reset();
      setEditing(null);
      onNotice(result.productRemoved
        ? "Sản phẩm hết hàng đã được xóa khỏi kho và cửa hàng."
        : editing ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.");
      await refreshAdminData().catch(() => {
        setError("Đã lưu sản phẩm nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được sản phẩm.");
    } finally {
      setLoading(false);
    }
  }

  async function recordSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setSaleLoading(true);
    setError("");
    try {
      const result = await adminService.recordSale(selectedProduct.id, Number(saleQuantity), Number(salePrice));
      if (result.productRemoved) {
        setSelectedProductId("");
        setSalePrice("");
      }
      onNotice(result.productRemoved
        ? "Đã ghi nhận bán hàng. Sản phẩm hết hàng đã được xóa khỏi kho và cửa hàng."
        : "Đã ghi nhận bán hàng và cập nhật tồn kho.");
      setSaleQuantity("1");
      try {
        await refreshAdminData();
      } catch {
        setError("Đã ghi nhận giao dịch nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể ghi nhận bán hàng.");
    } finally {
      setSaleLoading(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!await confirmDeleteProduct(product.name)) return;
    try {
      await productService.remove(product.id);
      onNotice("Đã xóa sản phẩm.");
      await refreshAdminData().catch(() => {
        setError("Đã xóa sản phẩm nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xóa được sản phẩm.");
    }
  }

  async function updateSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSale) return;
    const data = new FormData(event.currentTarget);
    setSaleEditLoading(true);
    setSaleEditError("");
    try {
      await adminService.updateSale(
        editingSale.id,
        Number(data.get("quantity")),
        Number(data.get("unitPrice")),
        String(data.get("reason") ?? ""),
      );
      setEditingSale(null);
      onNotice("Đã điều chỉnh giao dịch, tồn kho và báo cáo doanh thu.");
      await refreshAdminData().catch(() => {
        setSaleEditError("Đã cập nhật giao dịch nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      });
    } catch (cause) {
      setSaleEditError(cause instanceof Error ? cause.message : "Không thể điều chỉnh giao dịch.");
    } finally {
      setSaleEditLoading(false);
    }
  }

  async function voidSale(sale: SaleRecord) {
    const reason = await promptSaleReason({
      title: `Hủy giao dịch #${sale.id}?`,
      message: `${sale.productName} sẽ được loại khỏi doanh thu và hoàn số lượng về kho. Giao dịch vẫn được lưu trong tab "Đã hủy" để đối soát lịch sử kho. Vui lòng nhập lý do hủy.`,
      confirmText: "Hủy giao dịch",
    });
    if (!reason) return;
    setSalesError("");
    try {
      await adminService.voidSale(sale.id, reason.trim());
      onNotice("Đã hủy giao dịch, hoàn tồn kho. Lịch sử vẫn được lưu trong tab Đã hủy.");
      await refreshAdminData().catch(() => {
        setSalesError("Đã hủy giao dịch nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      });
    } catch (cause) {
      setSalesError(cause instanceof Error ? cause.message : "Không thể hủy giao dịch.");
    }
  }

  async function resetTestSales() {
    const reason = await promptSaleReason({
      title: "Reset doanh thu thử nghiệm?",
      message: "Tất cả giao dịch hoàn tất sẽ bị hủy khỏi báo cáo, hàng được hoàn về kho và lịch sử kiểm toán vẫn được giữ. Thao tác không thể hoàn tác.",
      confirmText: "Reset doanh thu",
    });
    if (!reason) return;
    setResetLoading(true);
    setSalesError("");
    try {
      const result = await adminService.resetSales(reason);
      onNotice(result.voidedSales
        ? `Đã reset doanh thu: hủy ${result.voidedSales} giao dịch, hoàn kho ${result.inventoryRestored} giao dịch${result.inventoryNotRestored ? `; ${result.inventoryNotRestored} giao dịch cũ không đủ dữ liệu để hoàn kho` : ""}.`
        : "Không có giao dịch hoàn tất để reset.");
      await refreshAdminData().catch(() => {
        setSalesError("Đã reset doanh thu nhưng chưa thể làm mới dữ liệu. Vui lòng tải lại trang.");
      });
    } catch (cause) {
      setSalesError(cause instanceof Error ? cause.message : "Không thể reset doanh thu.");
    } finally {
      setResetLoading(false);
    }
  }

  async function createPageAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountSaving(true);
    setAccountsError("");
    try {
      const account = await adminService.createPageAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        ownerNote: newAdminOwnerNote,
      });
      setPageAdmins(current => [...current, account]);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminOwnerNote("");
      onNotice(`Đã tạo tài khoản quản trị cho ${account.name}.`);
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : "Không thể tạo tài khoản quản trị.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function saveAdminOwnerNote(accountId: string) {
    setAccountsError("");
    try {
      const updated = await adminService.updatePageAdminNote(accountId, editingAdminNote);
      setPageAdmins(current => current.map(account => account.id === accountId ? updated : account));
      setEditingAdminNoteId(null);
      onNotice("Đã cập nhật ghi chú chủ sở hữu tài khoản.");
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : "Không thể cập nhật ghi chú tài khoản.");
    }
  }

  async function deletePageAdmin(account: PageAdminAccount) {
    if (!await confirmDeletePageAdmin(account.name)) return;
    setDeletingAdminId(account.id);
    setAccountsError("");
    try {
      await adminService.deletePageAdmin(account.id);
      setPageAdmins(current => current.filter(item => item.id !== account.id));
      if (editingAdminNoteId === account.id) setEditingAdminNoteId(null);
      onNotice(`Đã xóa tài khoản quản trị của ${account.name}.`);
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : "Không thể xóa tài khoản quản trị.");
    } finally {
      setDeletingAdminId(null);
    }
  }

  if (authLoading) return <main className="empty-state"><LoadingIndicator label="Đang kiểm tra quyền truy cập..." /></main>;
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") return <NotFoundPage />;

  const visibleSales = sales.filter(sale => sale.status === salesFilter);

  return (
    <main className="admin-page section-wrap">
      <span className="eyebrow">KHU VỰC QUẢN TRỊ</span>
      <h1>Quản lý <em>cửa hàng</em></h1>
      {!isSuperAdmin && <p className="admin-permission-note">Tài khoản quản trị page có thể quản lý sản phẩm, ghi nhận giao dịch, xem báo cáo doanh thu và xem lịch sử bán hàng. Chỉ Super Admin mới được chỉnh sửa hoặc hủy giao dịch.</p>}
      {isSuperAdmin && (
        <section className="admin-account-management" aria-label="Quản lý tài khoản quản trị">
          <h2>Thêm tài khoản quản trị page</h2>
          <p>Tài khoản này chỉ có quyền thêm, sửa, xóa sản phẩm và ghi nhận giao dịch.</p>
          <form className="admin-account-form" onSubmit={createPageAdmin}>
            <label>Họ và tên<input value={newAdminName} onChange={event => setNewAdminName(event.target.value)} minLength={2} maxLength={100} required /></label>
            <label>Email đăng nhập<input type="email" autoComplete="off" value={newAdminEmail} onChange={event => setNewAdminEmail(event.target.value)} maxLength={254} required /></label>
            <label>Mật khẩu ban đầu<input type="password" autoComplete="new-password" value={newAdminPassword} onChange={event => setNewAdminPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
            <label>Ghi chú chủ sở hữu<input value={newAdminOwnerNote} onChange={event => setNewAdminOwnerNote(event.target.value)} minLength={2} maxLength={200} required placeholder="Ví dụ: Nhân viên cửa hàng - Lan" /></label>
            {accountsError && <p className="inline-error">{accountsError}</p>}
            <button className="button button-primary" disabled={accountSaving}>{accountSaving ? "Đang tạo..." : "Tạo tài khoản quản trị"}</button>
          </form>
          <div className="admin-account-list">
            <h3>Tài khoản quản trị page ({pageAdmins.length})</h3>
            {pageAdmins.map(account => (
              <article className="admin-account-entry" key={account.id}>
                <div className="admin-account-row">
                  <b>{account.name}</b><span>{account.email}</span>
                  <small>Chủ tài khoản: {account.ownerNote || "Chưa ghi chú"}</small>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setEditingAdminNoteId(editingAdminNoteId === account.id ? null : account.id);
                      setEditingAdminNote(account.ownerNote ?? "");
                      setAccountsError("");
                    }}
                  >
                    {editingAdminNoteId === account.id ? "Đóng" : "Sửa ghi chú"}
                  </button>
                  <button
                    type="button"
                    className="text-button admin-account-delete"
                    disabled={deletingAdminId === account.id}
                    onClick={() => void deletePageAdmin(account)}
                    aria-label={`Xóa tài khoản quản trị của ${account.name}`}
                  >
                    <Trash2 size={14} /> {deletingAdminId === account.id ? "Đang xóa..." : "Xóa tài khoản"}
                  </button>
                </div>
                {editingAdminNoteId === account.id && (
                  <form
                    className="admin-account-note-form"
                    onSubmit={event => {
                      event.preventDefault();
                      void saveAdminOwnerNote(account.id);
                    }}
                  >
                    <label>
                      Ghi chú chủ sở hữu
                      <input
                        value={editingAdminNote}
                        onChange={event => setEditingAdminNote(event.target.value)}
                        minLength={2}
                        maxLength={200}
                        required
                      />
                    </label>
                    <button className="button button-primary">Lưu ghi chú</button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="admin-dashboard" aria-label="Báo cáo doanh thu">
        <div className="admin-revenue-cards">
          <article><span>DOANH THU HÔM NAY</span><strong>{report ? formatCurrency(report.todayRevenue) : <span className="loading-shimmer admin-revenue-skeleton" aria-label="Đang tải doanh thu" />}</strong><small>{report?.today ?? " "}</small></article>
          <article><span>DOANH THU THÁNG NÀY</span><strong>{report ? formatCurrency(report.monthRevenue) : <span className="loading-shimmer admin-revenue-skeleton" aria-label="Đang tải doanh thu" />}</strong><small>{report ? `${String(report.month).padStart(2, "0")}/${report.year}` : " "}</small></article>
        </div>
        {reportError && <p className="inline-error">{reportError}</p>}
        <section className="admin-sales-history">
          <div className="admin-sales-heading">
            <h2>Lịch sử bán hàng</h2>
            <div className="admin-sales-controls">
              <span className="muted">Đã tải {sales.length}/{salesTotal} giao dịch{isSuperAdmin ? " · chỉnh sửa/hủy đều cần lý do" : ""}</span>
              {isSuperAdmin && salesTotalCompleted > 0 && (
                <button className="button admin-reset-button" disabled={resetLoading} onClick={() => void resetTestSales()}>
                  <RotateCcw size={14} /> {resetLoading ? "Đang reset..." : "Reset doanh thu test"}
                </button>
              )}
            </div>
          </div>
          <p className="admin-sales-note">Giao dịch đã hủy vẫn được lưu tại tab riêng để kiểm kê và đối soát tồn kho; thao tác hủy chỉ hoàn hàng về kho và loại giao dịch khỏi doanh thu.</p>
          {salesError && <p className="inline-error">{salesError}</p>}
          <div className="admin-sales-tabs" role="tablist" aria-label="Lọc lịch sử giao dịch">
            <button
              type="button"
              role="tab"
              aria-selected={salesFilter === "COMPLETED"}
              className={`success${salesFilter === "COMPLETED" ? " active" : ""}`}
              onClick={() => setSalesFilter("COMPLETED")}
            >
              Đã bán <span>{salesTotalCompleted}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={salesFilter === "VOIDED"}
              className={`danger${salesFilter === "VOIDED" ? " active" : ""}`}
              onClick={() => setSalesFilter("VOIDED")}
            >
              Đã hủy <span>{salesTotalVoided}</span>
            </button>
          </div>
          {salesLoading ? <LoadingIndicator label="Đang tải lịch sử giao dịch..." /> : visibleSales.length === 0 ? (
            <p className="muted">{salesFilter === "COMPLETED" ? "Chưa có giao dịch bán thành công." : "Chưa có giao dịch nào bị hủy."}</p>
          ) : visibleSales.map(sale => (
            <article className={`admin-sale-row${sale.status === "VOIDED" ? " admin-sale-voided" : ""}`} key={sale.id}>
              <div className="admin-sale-summary">
                <div>
                  <b>#{sale.id} · {sale.productName}</b>
                  <span>{new Date(sale.soldAt).toLocaleString("vi-VN")} · {sale.quantity} sản phẩm × {formatCurrency(sale.unitPrice)}</span>
                  {sale.status === "VOIDED" && <small>ĐÃ HỦY · {sale.voidReason}</small>}
                </div>
                <strong>{sale.status === "COMPLETED" ? formatCurrency(Number(sale.unitPrice) * sale.quantity) : "Đã loại khỏi doanh thu"}</strong>
                {isSuperAdmin && sale.status === "COMPLETED" && (
                  <>
                    <button className="text-button" onClick={() => { setEditingSale(sale); setSaleEditError(""); }}><Pencil size={14} /> Sửa</button>
                    <button className="text-button sale-void-button" onClick={() => void voidSale(sale)}><Ban size={14} /> Hủy</button>
                  </>
                )}
              </div>
              {isSuperAdmin && editingSale?.id === sale.id && (
                <form className="admin-sale-edit-form" onSubmit={updateSale}>
                  <div className="form-row">
                    <label>Số lượng<input name="quantity" type="number" min="1" max="100000" required defaultValue={sale.quantity} /></label>
                    <label>Giá bán / sản phẩm<input name="unitPrice" type="number" min="1" step="1" required defaultValue={sale.unitPrice} /></label>
                  </div>
                  <label>Lý do điều chỉnh<input name="reason" minLength={5} maxLength={500} required placeholder="Ví dụ: Nhập nhầm số lượng" /></label>
                  {saleEditError && <p className="inline-error">{saleEditError}</p>}
                  <button className="button button-primary" disabled={saleEditLoading}>{saleEditLoading ? "Đang lưu..." : "Lưu điều chỉnh"}</button>
                  <button type="button" className="text-button" onClick={() => setEditingSale(null)}>Đóng</button>
                </form>
              )}
              {sale.audits.length > 0 && (
                <details className="admin-sale-audits">
                  <summary>Lịch sử điều chỉnh ({sale.audits.length})</summary>
                  {sale.audits.map(audit => (
                    <p key={audit.id}>
                      {audit.action === "EDIT" ? "Đã chỉnh sửa" : "Đã hủy"}
                      {" "}bởi {audit.adminName || "Quản trị viên"} · {new Date(audit.createdAt).toLocaleString("vi-VN")} · {audit.reason}
                      {audit.action === "EDIT" && (
                        <> · {audit.before.quantity} × {formatCurrency(audit.before.unitPrice)} → {audit.after.quantity} × {formatCurrency(audit.after.unitPrice)}</>
                      )}
                    </p>
                  ))}
                </details>
              )}
            </article>
          ))}
          {!salesLoading && sales.length < salesTotal && (
            <button className="button admin-sales-load-more" type="button" disabled={salesLoadingMore} onClick={() => void loadMoreSales()}>
              {salesLoadingMore ? "Đang tải thêm..." : `Tải thêm lịch sử (${salesTotal - sales.length} giao dịch)`}
            </button>
          )}
        </section>
        {report && (
          <div className="admin-revenue-history">
            <section>
              <h2>Doanh thu theo ngày</h2>
              <div className="admin-report-list">
                {report.daily.map(day => (
                  <div key={day.date}><span>{day.date.slice(-2)}/{String(report.month).padStart(2, "0")}/{report.year}</span><b>{formatCurrency(day.revenue)}</b><small>{day.unitsSold} sản phẩm</small></div>
                ))}
              </div>
            </section>
            <section>
              <h2>Doanh thu theo tháng</h2>
              <div className="admin-report-list">
                {report.monthly.map(month => (
                  <div key={month.month}><span>{month.month.slice(-2)}/{report.year}</span><b>{formatCurrency(month.revenue)}</b><small>{month.unitsSold} sản phẩm</small></div>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
      <div className="admin-layout">
        <form className="admin-form" onSubmit={saveProduct}>
          <h2>{editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
          <label>Tên sản phẩm<input name="name" required minLength={2} maxLength={120} defaultValue={editing?.name ?? ""} placeholder="Ví dụ: Kẹp nơ hoa nhí" /></label>
          <label>Mô tả<textarea name="description" required maxLength={5000} defaultValue={editing?.description ?? ""} placeholder="Mô tả sản phẩm..." rows={4} /></label>
          <div className="form-row">
            <label>Giá (VNĐ)<input name="price" type="number" min="1" step="1" required defaultValue={editing?.price ?? ""} /></label>
            <label>Số lượng<input name="stock" type="number" min="0" step="1" required defaultValue={editing?.stock ?? 0} /></label>
          </div>
          <label>Giảm giá (%) <span className="muted">để trống nếu không sale</span><input name="discountPercent" type="number" min="0.01" max="99.99" step="0.01" defaultValue={editing?.discountPercent ?? ""} placeholder="Ví dụ: 20" /></label>
          <label>Ảnh sản phẩm {editing && <span className="muted">(để trống nếu không đổi ảnh)</span>}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!editing} /></label>
          {error && <p className="inline-error">{error}</p>}
          <button className="button button-primary" disabled={loading}>{loading ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm sản phẩm"} <ArrowRight size={16} /></button>
          {editing && <button type="button" className="text-button cancel-edit" onClick={() => setEditing(null)}>Hủy chỉnh sửa</button>}
        </form>
        <div className="admin-inventory-column">
          <form className="admin-form admin-sale-form" onSubmit={recordSale}>
            <h2><Boxes size={19} /> Ghi nhận bán hàng</h2>
            <p className="muted">Lưu giao dịch, trừ tồn kho và cập nhật báo cáo doanh thu.</p>
            <label>Sản phẩm
              <select required value={selectedProductId} onChange={event => setSelectedProductId(event.target.value)}>
                <option value="">{productsLoading ? "Đang tải sản phẩm..." : "Chọn sản phẩm"}</option>
                {products.map(product => <option key={product.id} value={product.id} disabled={product.stock < 1}>{product.name} · Tồn: {product.stock}</option>)}
              </select>
            </label>
            <div className="form-row">
              <label>Số lượng bán<input type="number" min="1" max={selectedProduct?.stock ?? 100000} step="1" required value={saleQuantity} onChange={event => setSaleQuantity(event.target.value)} /></label>
              <label>Giá bán / sản phẩm (VNĐ)<input type="number" min="1" step="1" required value={salePrice} onChange={event => setSalePrice(event.target.value)} /></label>
            </div>
            {error && <p className="inline-error">{error}</p>}
            <button className="button button-primary" disabled={productsLoading || saleLoading || !selectedProduct || selectedProduct.stock < 1}>{saleLoading ? "Đang ghi nhận..." : "Ghi nhận giao dịch"} <ArrowRight size={16} /></button>
          </form>
          <section className="admin-products">
            <h2><Boxes size={19} /> Kho hàng · {productsLoading ? "đang tải" : `${products.length} sản phẩm`}</h2>
            {productsLoading ? <AdminProductsSkeleton /> : products.length === 0 ? <p>Chưa có sản phẩm nào.</p> : products.map(product => (
              <article className="admin-product-row" key={product.id}>
                <img src={resolveImageUrl(product.imageUrl)} alt="" />
                <div><b>{product.name}</b><span>{isOnSale(product) ? <><del>{formatCurrency(product.price)}</del> {formatCurrency(effectivePrice(product))} · GIẢM {Number(product.discountPercent)}%</> : formatCurrency(product.price)} · Còn <strong className={product.stock <= 5 ? "stock-low" : "stock-ok"}>{product.stock}</strong></span></div>
                <button className="text-button" onClick={() => { setEditing(product); document.querySelector(".admin-form:not(.admin-sale-form)")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Sửa</button>
                <button className="icon-button" aria-label={`Xóa ${product.name}`} onClick={() => void deleteProduct(product)}><Trash2 size={16} /></button>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
