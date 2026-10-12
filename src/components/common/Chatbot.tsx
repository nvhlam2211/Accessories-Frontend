import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../types";
import { effectivePrice, formatCurrency, isOnSale } from "../../utils/formatCurrency";
import "./Chatbot.css";

type ChatMessage = {
  id: number;
  role: "assistant" | "customer";
  text: string;
  products?: Product[];
};

const suggestions = ["Sản phẩm bán chạy", "Sản phẩm đang giảm giá"];
const stopWords = new Set([
  "minh", "muon", "tim", "kiem", "cho", "xem", "co", "khong", "shop", "oi",
  "san", "pham", "nao", "giup", "voi", "ban", "dang", "loai", "mot", "vai",
  "hay", "va", "la", "toi", "em", "anh", "chi", "gia", "bao", "nhieu",
  "chiec", "cai", "nhung", "cac", "nay", "kia", "dang", "muon",
]);
const chatStorageKey = "may-accessories-chat-history";
const welcomeMessage: ChatMessage = {
  id: 0,
  role: "assistant",
  text: "Xin chào! Mây có thể trò chuyện và giúp bạn tìm sản phẩm, xem giá, kiểm tra hàng còn hay không. Bạn cứ hỏi Mây nhé!",
};

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return typeof product.id === "number"
    && typeof product.name === "string"
    && typeof product.description === "string"
    && (typeof product.price === "string" || typeof product.price === "number")
    && typeof product.stock === "number"
    && typeof product.imageUrl === "string"
    && typeof product.active === "boolean";
}

function readChatHistory(): { messages: ChatMessage[]; error: string } {
  try {
    const stored = window.localStorage.getItem(chatStorageKey);
    if (!stored) return { messages: [welcomeMessage], error: "" };
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Dữ liệu lịch sử chat không hợp lệ.");
    const messages = parsed.filter((value): value is ChatMessage => {
      if (!value || typeof value !== "object") return false;
      const message = value as Record<string, unknown>;
      return typeof message.id === "number"
        && (message.role === "assistant" || message.role === "customer")
        && typeof message.text === "string"
        && (message.products === undefined || (Array.isArray(message.products) && message.products.every(isProduct)));
    });
    return { messages: messages.length ? messages : [welcomeMessage], error: "" };
  } catch {
    return { messages: [welcomeMessage], error: "Không thể đọc lịch sử chat trên thiết bị này." };
  }
}

function normalizeForIntent(text: string): string {
  return text.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

type PriceFilter = { min?: number; max?: number };

function extractPriceFilter(question: string): PriceFilter | null {
  const normalized = normalizeForIntent(question);
  const amounts = Array.from(normalized.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|tr)?\b/g));
  const hasPriceLanguage = /\b(gia|tam|duoi|tren|toi da|toi thieu|khong qua|tro xuong|do ve|tu|den|khoang)\b/.test(normalized);
  if (!amounts.length || (!hasPriceLanguage && !amounts.some(amount => amount[2]))) return null;

  const parseAmount = (value: string, unit: string | undefined) => {
    const number = !unit && /^\d{1,3}(?:[.,]\d{3})+$/.test(value)
      ? Number(value.replace(/[.,]/g, ""))
      : Number(value.replace(",", "."));
    const multiplier = unit === "k" || unit === "nghin" || unit === "ngan"
      ? 1_000
      : unit === "tr" || unit === "trieu" ? 1_000_000 : 1;
    return number * multiplier;
  };
  const values = amounts.map(amount => parseAmount(amount[1], amount[2]));
  const isMinimum = /\b(tren|tro len|toi thieu|it nhat|tu)\b/.test(normalized) && !/\b(den|toi da|khong qua|tro xuong|do ve|duoi)\b/.test(normalized);

  if (values.length > 1) {
    return { min: Math.min(values[0], values[1]), max: Math.max(values[0], values[1]) };
  }
  return isMinimum ? { min: values[0] } : { max: values[0] };
}

function extractProductQuery(question: string): string {
  return question.toLocaleLowerCase("vi")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(term => term.length > 1 && !stopWords.has(normalizeForIntent(term)))
    .join(" ")
    .trim();
}

function productKeywords(text: string): string[] {
  return normalizeForIntent(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(term => term.length > 1 && !stopWords.has(term));
}

function editDistance(first: string, second: string): number {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= second.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (first[row - 1] === second[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[second.length];
}

function typoMatchScore(query: string, product: Product): number {
  const queryWords = productKeywords(query);
  const productWords = productKeywords(product.name);
  if (!queryWords.length || !productWords.length) return 0;

  let matched = 0;
  for (const queryWord of queryWords) {
    if (productWords.some(productWord => {
      if (queryWord === productWord) return true;
      const maxDistance = Math.min(queryWord.length, productWord.length) >= 6 ? 2 : 1;
      return Math.abs(queryWord.length - productWord.length) <= maxDistance
        && editDistance(queryWord, productWord) <= maxDistance;
    })) matched += 1;
  }

  return matched >= 2 ? matched / queryWords.length : 0;
}

function smallTalkReply(question: string): string | null {
  const normalized = normalizeForIntent(question);
  if (/\b(chao|hello|hi|xin chao|hey)\b/.test(normalized)) {
    return "Chào bạn! Mây rất vui được tư vấn cho bạn. Hôm nay bạn muốn tìm món phụ kiện nào nè?";
  }
  if (/\b(cam on|thanks|thank you)\b/.test(normalized)) {
    return "Mây vui vì giúp được bạn! Nếu cần tìm thêm sản phẩm hay kiểm tra giá, cứ nhắn Mây nhé.";
  }
  if (/\b(khoe khong|hom nay the nao|an com chua)\b/.test(normalized)) {
    return "Mây luôn vui khi được trò chuyện với bạn ạ! Còn bạn, hôm nay đã tìm được món phụ kiện ưng ý chưa?";
  }
  if (/\b(hen gap|tam biet|bye)\b/.test(normalized)) {
    return "Tạm biệt bạn nhé! Mây luôn ở đây khi bạn cần tìm món xinh.";
  }
  if (/\b(ban la ai|may la ai|tro ly)\b/.test(normalized)) {
    return "Mây là trợ lý tư vấn của Mây Accessories. Mây có thể trò chuyện, tìm sản phẩm, xem giá và kiểm tra tình trạng còn hàng cho bạn.";
  }
  if (/\b(giao hang|ship|van chuyen)\b/.test(normalized)) {
    return "Shop hỗ trợ giao hàng toàn quốc. Bạn có thể nhắn Mây tên sản phẩm muốn mua để xem thông tin, rồi liên hệ shop để được hướng dẫn đặt hàng nhé.";
  }
  if (/\b(dat hang|mua hang|thanh toan|chot don)\b/.test(normalized)) {
    return "Bạn có thể thêm sản phẩm vào giỏ để chọn món yêu thích. Website hiện chưa thanh toán trực tuyến; để chốt đơn, bạn vui lòng liên hệ shop qua Facebook nhé.";
  }
  if (/\b(doi tra|hoan tien|bao hanh)\b/.test(normalized)) {
    return "Mây chưa có thông tin chính sách đổi trả cụ thể để xác nhận với bạn. Bạn vui lòng nhắn shop qua Facebook để được hỗ trợ chính xác nhé.";
  }
  if (/\b(mo cua|gio lam viec|dia chi|cua hang o dau)\b/.test(normalized)) {
    return "Mây chưa được cung cấp giờ hoạt động hoặc địa chỉ cửa hàng. Bạn vui lòng nhắn shop qua Facebook để nhận thông tin chính xác nhé.";
  }
  if (/\b(lien he|facebook|nhan vien|tu van vien|nguoi that)\b/.test(normalized)) {
    return "Nếu bạn cần nhân viên hỗ trợ trực tiếp, hãy nhắn shop qua Facebook nhé. Còn Mây có thể tìm sản phẩm và kiểm tra giá ngay tại đây.";
  }
  if (/\b(may oi|shop oi|tu van|giup minh)\b/.test(normalized)) {
    return "Mây đây ạ! Bạn cần tìm sản phẩm, xem món đang giảm giá hay kiểm tra sản phẩm còn hàng không?";
  }
  return null;
}

export default function Chatbot({ onAdd }: { onAdd: (product: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [storedChat] = useState(readChatHistory);
  const [messages, setMessages] = useState<ChatMessage[]>(storedChat.messages);
  const [storageError, setStorageError] = useState(storedChat.error);
  const [catalogChecked, setCatalogChecked] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(Math.max(0, ...storedChat.messages.map(message => message.id)) + 1);

  useEffect(() => {
    try {
      window.localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      setStorageError("");
    } catch {
      setStorageError("Không thể lưu lịch sử chat trên thiết bị này.");
    }
  }, [messages]);

  useEffect(() => {
    productService.list("?limit=100").then(products => {
      const availableIds = new Set(products.filter(product => product.stock > 0).map(product => product.id));
      setMessages(current => current.map(message => message.products
        ? { ...message, products: message.products.filter(product => availableIds.has(product.id)) }
        : message));
      setCatalogChecked(true);
    }).catch(() => {
      setCatalogError("Chưa kiểm tra được tồn kho sản phẩm. Vui lòng thử lại sau.");
      setCatalogChecked(true);
    });
  }, []);

  useEffect(() => {
    if (open) transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || loading) return;
    setMessages(current => [...current, { id: nextId.current++, role: "customer", text }]);
    setInput("");
    const conversation = smallTalkReply(text);
    if (conversation) {
      setMessages(current => [...current, { id: nextId.current++, role: "assistant", text: conversation }]);
      return;
    }
    setLoading(true);
    try {
      const normalized = text.toLocaleLowerCase("vi");
      const normalizedQuery = normalizeForIntent(text);
      const priceFilter = extractPriceFilter(text);
      let products: Product[] = [];
      let reply: string;
      if (priceFilter) {
        const availableProducts = await productService.list("?limit=100");
        const discountedOnly = /(sale|giảm giá|khuyến mãi|ưu đãi)/i.test(normalized);
        products = availableProducts
          .filter(product => product.stock > 0
            && (!discountedOnly || isOnSale(product))
            && (priceFilter.min === undefined || effectivePrice(product) >= priceFilter.min)
            && (priceFilter.max === undefined || effectivePrice(product) <= priceFilter.max))
          .sort((first, second) => effectivePrice(first) - effectivePrice(second))
          .slice(0, 5);
        const priceDescription = priceFilter.min !== undefined && priceFilter.max !== undefined
          ? `từ ${formatCurrency(priceFilter.min)} đến ${formatCurrency(priceFilter.max)}`
          : priceFilter.min !== undefined
            ? `từ ${formatCurrency(priceFilter.min)} trở lên`
            : `tối đa ${formatCurrency(priceFilter.max!)}`;
        reply = products.length
          ? `Đây là các sản phẩm còn hàng trong khoảng giá ${priceDescription}${discountedOnly ? " đang giảm giá" : ""} ạ:`
          : `Hiện chưa có sản phẩm còn hàng trong khoảng giá ${priceDescription}${discountedOnly ? " đang giảm giá" : ""} ạ. Bạn thử mức giá khác nhé.`;
      } else if (/(ban chay|ban nhieu|duoc mua nhieu)/.test(normalizedQuery)) {
        products = await productService.listBestSellers();
        if (products.length) {
          reply = "Đây là những sản phẩm bán chạy nhất hiện còn hàng tại shop ạ:";
        } else {
          products = (await productService.list("?limit=100"))
            .filter(product => product.stock > 0)
            .slice(0, 3);
          reply = products.length
            ? "Shop chưa có đủ dữ liệu bán hàng để xếp hạng, Mây gợi ý bạn một vài sản phẩm đang còn hàng nhé:"
            : "Hiện tại shop chưa có sản phẩm còn hàng để gợi ý ạ.";
        }
      } else if (/(sale|giảm giá|khuyến mãi|ưu đãi)/i.test(normalized)) {
        products = await productService.listSale();
        reply = products.length
          ? "Đây là những sản phẩm đang giảm giá và còn hàng tại shop ạ:"
          : "Hiện tại shop chưa có sản phẩm giảm giá nào còn hàng ạ.";
      } else if (/(còn hàng|tồn kho|có hàng|sẵn hàng|shop còn những sản phẩm nào)/i.test(normalized)) {
        products = (await productService.list("?limit=100"))
          .filter(product => product.stock > 0)
          .slice(0, 5);
        reply = products.length
          ? "Đây là một số sản phẩm hiện còn hàng tại shop ạ:"
          : "Hiện tại shop chưa có sản phẩm nào còn hàng ạ.";
      } else {
        const query = extractProductQuery(text);
        products = query ? await productService.search(query, 10) : [];
        products = products.filter(product => product.stock > 0).slice(0, 4);

        if (products.length) {
          reply = `Mây tìm thấy sản phẩm có cụm từ “${query}” và hiện còn hàng ạ:`;
        } else if (query) {
          const availableProducts = await productService.list("?limit=100");
          const typoMatches = availableProducts
            .map(product => ({ product, score: typoMatchScore(query, product) }))
            .filter(match => match.score > 0)
            .sort((first, second) => second.score - first.score)
            .slice(0, 4);
          products = typoMatches.map(match => match.product);
          if (products.length) {
            const firstProductName = products[0].name;
            reply = `Mây chưa tìm thấy đúng “${query}”. Có phải bạn đang tìm ${firstProductName} không? Đây là sản phẩm gần nhất Mây tìm được ạ:`;
          } else if (/\bkep no\b/.test(normalizedQuery)) {
            products = availableProducts
              .filter(product => /\bkep toc\b/.test(normalizeForIntent(product.name)))
              .slice(0, 4);
            reply = products.length
              ? "Hiện tại cửa hàng chưa có kẹp nơ. Có phải bạn đang tìm kẹp tóc không? Mây gợi ý các mẫu kẹp tóc đang còn hàng nhé:"
              : "Hiện tại cửa hàng đang hết kẹp nơ, bạn có thể tìm thêm sản phẩm khác đang có tại cửa hàng nhé.";
          } else {
            reply = `Hiện tại cửa hàng đang hết hoặc chưa có sản phẩm “${query}”. Bạn có thể tìm thêm sản phẩm khác đang có tại cửa hàng nhé.`;
          }
        } else {
          reply = "Bạn cho Mây biết tên sản phẩm muốn tìm nhé, Mây sẽ kiểm tra đúng sản phẩm đó cho bạn.";
        }
      }
      products = products.filter(product => product.stock > 0);

      setMessages(current => [...current, { id: nextId.current++, role: "assistant", text: reply, products }]);
    } catch (cause) {
      setMessages(current => [...current, {
        id: nextId.current++,
        role: "assistant",
        text: cause instanceof Error ? `Mây chưa tra cứu được lúc này: ${cause.message}` : "Mây chưa tra cứu được lúc này. Bạn thử lại sau nhé.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  function clearHistory() {
    nextId.current = 1;
    setMessages([welcomeMessage]);
  }

  return (
    <aside className="chatbot">
      {open && (
        <section className="chatbot-panel" aria-label="Chat với Mây">
          <header className="chatbot-header">
            <span className="chatbot-avatar"><Bot size={19} /></span>
            <div><b>Mây tư vấn</b><small>Tra cứu sản phẩm tức thì</small></div>
            <button className="icon-button chatbot-clear" aria-label="Xóa lịch sử chat" title="Xóa lịch sử chat" disabled={loading} onClick={clearHistory}><Trash2 size={16} /><span>Xóa lịch sử</span></button>
            <button className="icon-button" aria-label="Đóng chat" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          <div className="chatbot-messages" ref={transcriptRef} aria-live="polite">
            {storageError && <p className="chatbot-storage-error" role="status">{storageError}</p>}
            {catalogError && <p className="chatbot-storage-error" role="status">{catalogError}</p>}
            {messages.map(message => (
              <article className={`chat-message chat-message-${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {catalogChecked && message.products?.map(product => (
                  <div className="chat-product" key={product.id}>
                    <Link to={`/san-pham/${product.id}`} onClick={() => setOpen(false)}>
                      <b>{product.name}</b>
                      <span>{formatCurrency(effectivePrice(product))}{isOnSale(product) && <del>{formatCurrency(product.price)}</del>}</span>
                      <small>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Tạm hết hàng"}</small>
                    </Link>
                    {product.stock > 0 && <button type="button" onClick={() => onAdd(product)}>Thêm giỏ</button>}
                  </div>
                ))}
              </article>
            ))}
            {loading && <p className="chatbot-loading">Mây đang tìm sản phẩm...</p>}
          </div>
          <div className="chatbot-suggestions">
            {suggestions.map(suggestion => (
              <button key={suggestion} type="button" disabled={loading} onClick={() => void ask(suggestion)}>{suggestion}</button>
            ))}
          </div>
          <form className="chatbot-form" onSubmit={submit}>
            <input aria-label="Nhập câu hỏi" value={input} onChange={event => setInput(event.target.value)} placeholder="Bạn muốn tìm sản phẩm nào?" />
            <button aria-label="Gửi câu hỏi" disabled={loading || !input.trim()}><Send size={17} /></button>
          </form>
        </section>
      )}
      <button className="chatbot-toggle" aria-label={open ? "Đóng trợ lý tư vấn" : "Mở trợ lý tư vấn"} onClick={() => setOpen(value => !value)}>
        {open ? <X size={22} /> : <><MessageCircle size={21} /><span>Tư vấn nhanh</span></>}
      </button>
    </aside>
  );
}
