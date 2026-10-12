import Swal from "sweetalert2";
import "./adminDialogs.css";

const dialogClass = {
  popup: "may-admin-swal-popup",
  title: "may-admin-swal-title",
  htmlContainer: "may-admin-swal-content",
  confirmButton: "may-admin-swal-confirm",
  cancelButton: "may-admin-swal-cancel",
};

export async function confirmDeleteProduct(productName: string): Promise<boolean> {
  const result = await Swal.fire({
    title: "Xóa sản phẩm?",
    text: `Bạn có chắc muốn xóa “${productName}” khỏi cửa hàng không?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa sản phẩm",
    cancelButtonText: "Giữ lại",
    reverseButtons: true,
    focusCancel: true,
    customClass: dialogClass,
    buttonsStyling: false,
  });
  return result.isConfirmed;
}

export async function confirmDeletePageAdmin(adminName: string): Promise<boolean> {
  const result = await Swal.fire({
    title: "Xóa tài khoản quản trị?",
    text: `Tài khoản ${adminName} sẽ bị xóa và không thể đăng nhập quản trị shop nữa. Lịch sử kiểm toán vẫn được giữ.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa tài khoản",
    cancelButtonText: "Giữ lại",
    reverseButtons: true,
    focusCancel: true,
    customClass: dialogClass,
    buttonsStyling: false,
  });
  return result.isConfirmed;
}

export async function promptSaleReason(options: {
  title: string;
  message: string;
  confirmText: string;
}): Promise<string | null> {
  const result = await Swal.fire({
    title: options.title,
    text: options.message,
    input: "textarea",
    inputPlaceholder: "Nhập lý do (ít nhất 5 ký tự)",
    inputAttributes: { "aria-label": "Lý do điều chỉnh giao dịch" },
    inputValidator: value => value.trim().length < 5
      ? "Vui lòng nhập lý do ít nhất 5 ký tự."
      : undefined,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText,
    cancelButtonText: "Quay lại",
    reverseButtons: true,
    focusCancel: true,
    customClass: dialogClass,
    buttonsStyling: false,
  });
  return result.isConfirmed && typeof result.value === "string" ? result.value.trim() : null;
}
