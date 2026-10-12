import Swal from "sweetalert2";
import type { Product } from "../types";
import { effectivePrice, formatCurrency } from "./formatCurrency";
import "sweetalert2/dist/sweetalert2.min.css";
import "./buyNow.css";

function getShopUrl(): URL | null {
  const configuredUrl = import.meta.env.VITE_FACEBOOK_URL;
  if (!configuredUrl || configuredUrl.includes("your-page")) return null;

  try {
    const url = new URL(configuredUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export async function confirmBuyNow(product: Product, quantity = 1): Promise<void> {
  const confirmation = await Swal.fire({
    title: "Xác nhận mua sản phẩm?",
    text: `${product.name} · ${quantity} sản phẩm · ${formatCurrency(effectivePrice(product) * quantity)}. Bạn sẽ được chuyển đến trang Facebook của shop để liên hệ đặt hàng.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Có, đến trang shop",
    cancelButtonText: "Để sau",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "may-swal-popup",
      title: "may-swal-title",
      htmlContainer: "may-swal-content",
      confirmButton: "may-swal-confirm",
      cancelButton: "may-swal-cancel",
    },
    buttonsStyling: false,
  });

  if (!confirmation.isConfirmed) return;

  const shopUrl = getShopUrl();
  if (!shopUrl) {
    await Swal.fire({
      title: "Shop chưa có liên kết đặt hàng",
      text: "Vui lòng liên hệ shop trực tiếp hoặc thử lại sau.",
      icon: "info",
      confirmButtonText: "Đã hiểu",
      customClass: {
        popup: "may-swal-popup",
        title: "may-swal-title",
        htmlContainer: "may-swal-content",
        confirmButton: "may-swal-confirm",
      },
      buttonsStyling: false,
    });
    return;
  }

  window.location.assign(shopUrl.href);
}
