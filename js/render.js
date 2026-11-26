import { CONFIG } from "./config.js";
import { getCartSubtotal, getCartTotalCount, state } from "./state.js";

export function formatIDR(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getGradeClass(grade) {
  const g = String(grade || "").toLowerCase();
  if (g.includes("original")) return "grade-original-bmw";
  if (g.includes("oem")) return "grade-oem";
  return "grade-aftermarket";
}

function getStockClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "ready") return "stock-ready";
  if (s.includes("pre")) return "stock-pre-order";
  return "stock-habis";
}

export function renderProducts(products, containerEl, summaryEl) {
  if (summaryEl) {
    const parts = [];
    if (state.filters.category !== "ALL") parts.push(state.filters.category);
    if (state.filters.chassis !== "ALL") parts.push(`Sasis ${state.filters.chassis}`);
    if (state.filters.search.trim()) parts.push(`"${state.filters.search.trim()}"`);

    const filterLabel = parts.length ? ` (${parts.join(" • ")})` : "";
    summaryEl.textContent = `Menampilkan ${products.length} part${filterLabel}`;
  }

  if (!products.length) {
    containerEl.innerHTML = `
      <div class="empty-state">
        Tidak ada part yang cocok dengan filter atau kata kunci saat ini.
      </div>
    `;
    return;
  }

  containerEl.innerHTML = products
    .map((item) => {
      const isOutOfStock = String(item.stock_status).toLowerCase() === "habis";
      const chassisText = item.chassis_codes.length ? item.chassis_codes.join(", ") : "-";
      const engineText = item.engine_codes.length ? item.engine_codes.join(", ") : "-";
      const imgSrc = item.image_url || CONFIG.FALLBACK_IMAGE;

      return `
        <article class="product-card">
          <div class="product-media">
            <img
              src="${escapeHTML(imgSrc)}"
              alt="${escapeHTML(item.part_name)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${CONFIG.FALLBACK_IMAGE}';"
            />
          </div>

          <div class="product-body">
            <div class="product-meta-top">
              <span class="grade-badge ${getGradeClass(item.grade)}">${escapeHTML(item.grade)}</span>
              <span class="stock-label ${getStockClass(item.stock_status)}">${escapeHTML(item.stock_status)}</span>
            </div>

            <div class="product-brand">${escapeHTML(item.brand)} &bull; ${escapeHTML(item.category)}</div>
            <h3 class="product-title">${escapeHTML(item.part_name)}</h3>

            <div class="product-specs">
              <p><strong>OEM:</strong> ${escapeHTML(item.oem_number)}</p>
              <p><strong>Sasis:</strong> ${escapeHTML(chassisText)}</p>
              <p><strong>Mesin:</strong> ${escapeHTML(engineText)}</p>
            </div>

            ${item.notes ? `<p class="product-notes">${escapeHTML(item.notes)}</p>` : ""}
          </div>

          <div class="product-footer">
            <span class="product-price">${formatIDR(item.price)}</span>
            <button
              type="button"
              class="btn btn-primary add-to-cart-btn"
              data-id="${escapeHTML(item.id)}"
              ${isOutOfStock ? "disabled" : ""}
            >
              ${isOutOfStock ? "Habis" : "+ Keranjang"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

export function renderCart(cartItemsContainerEl, subtotalEl, countBadgeEl, checkoutBtnEl) {
  const totalCount = getCartTotalCount();
  const subtotal = getCartSubtotal();

  if (countBadgeEl) {
    countBadgeEl.textContent = String(totalCount);
  }

  if (subtotalEl) {
    subtotalEl.textContent = formatIDR(subtotal);
  }

  if (checkoutBtnEl) {
    checkoutBtnEl.disabled = state.cart.length === 0;
  }

  if (!cartItemsContainerEl) return;

  if (!state.cart.length) {
    cartItemsContainerEl.innerHTML = `<p class="cart-empty">Keranjang masih kosong.</p>`;
    return;
  }

  cartItemsContainerEl.innerHTML = state.cart
    .map((item) => {
      const chassisText = item.chassis_codes?.length ? item.chassis_codes.join(", ") : "-";
      const lineTotal = item.price * item.qty;

      return `
        <div class="cart-item">
          <p class="cart-item-title">${escapeHTML(item.part_name)}</p>
          <p class="cart-item-sub">
            ${escapeHTML(item.brand)} &bull; ${escapeHTML(item.grade)} &bull; OEM: ${escapeHTML(item.oem_number)}<br />
            Sasis: ${escapeHTML(chassisText)} &bull; ${formatIDR(item.price)} / pcs
          </p>
          <div class="cart-item-actions">
            <div class="qty-controls">
              <button type="button" class="qty-btn" data-action="dec" data-id="${escapeHTML(item.id)}" aria-label="Kurangi jumlah">-</button>
              <span>${item.qty}</span>
              <button type="button" class="qty-btn" data-action="inc" data-id="${escapeHTML(item.id)}" aria-label="Tambah jumlah">+</button>
            </div>
            <strong>${formatIDR(lineTotal)}</strong>
            <button type="button" class="remove-btn" data-action="remove" data-id="${escapeHTML(item.id)}">Hapus</button>
          </div>
        </div>
      `;
    })
    .join("");
}

export function syncActiveCategoryCards(activeCategory) {
  const cards = document.querySelectorAll(".category-card-light");
  cards.forEach((card) => {
    const isMatch =
      activeCategory !== "ALL" && card.dataset.category === activeCategory;
    card.classList.toggle("is-active", isMatch);
  });
}