import { fetchCatalogCSV, parseCSV } from "./api.js";
import { CONFIG } from "./config.js";
import {
  renderCart,
  renderProducts,
  syncActiveCategoryCards
} from "./render.js";
import {
  addToCart,
  getFilteredProducts,
  removeFromCart,
  resetFilters,
  setProducts,
  state,
  updateCartQty,
  updateFilters
} from "./state.js";
import { buildWhatsAppOrderUrl } from "./whatsapp.js";

const els = {
  catalogGrid: document.getElementById("catalogGrid"),
  catalogSummary: document.getElementById("catalogSummary"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  chassisFilter: document.getElementById("chassisFilter"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  openCartBtn: document.getElementById("openCartBtn"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartOverlay: document.getElementById("cartOverlay"),
  cartItemsContainer: document.getElementById("cartItemsContainer"),
  cartSubtotal: document.getElementById("cartSubtotal"),
  cartCountBadge: document.getElementById("cartCountBadge"),
  checkoutWaBtn: document.getElementById("checkoutWaBtn")
};

function refreshCatalogView() {
  const filtered = getFilteredProducts();
  renderProducts(filtered, els.catalogGrid, els.catalogSummary);
  syncActiveCategoryCards(state.filters.category);
}

function refreshCartView() {
  renderCart(
    els.cartItemsContainer,
    els.cartSubtotal,
    els.cartCountBadge,
    els.checkoutWaBtn
  );
}

function openCart() {
  els.cartOverlay.hidden = false;
  els.cartDrawer.hidden = false;
}

function closeCart() {
  els.cartOverlay.hidden = true;
  els.cartDrawer.hidden = true;
}

function bindEvents() {
  // Pencarian real-time
  els.searchInput.addEventListener("input", (e) => {
    updateFilters({ search: e.target.value });
    refreshCatalogView();
  });

  // Filter dropdown kategori
  els.categoryFilter.addEventListener("change", (e) => {
    updateFilters({ category: e.target.value });
    refreshCatalogView();
  });

  // Filter dropdown kode sasis
  els.chassisFilter.addEventListener("change", (e) => {
    updateFilters({ chassis: e.target.value });
    refreshCatalogView();
  });

  // Klik salah satu dari 4 kartu kategori 2x2 (latar putih)
  document.querySelectorAll(".category-card-light").forEach((card) => {
    card.addEventListener("click", () => {
      const clickedCategory = card.dataset.category;
      const nextCategory =
        state.filters.category === clickedCategory ? "ALL" : clickedCategory;

      els.categoryFilter.value = nextCategory;
      updateFilters({ category: nextCategory });
      refreshCatalogView();

      document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Reset semua filter
  els.resetFiltersBtn.addEventListener("click", () => {
    resetFilters();
    els.searchInput.value = "";
    els.categoryFilter.value = "ALL";
    els.chassisFilter.value = "ALL";
    refreshCatalogView();
  });

  // Delegasi klik "+ Keranjang" pada kartu produk
  els.catalogGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn) return;
    addToCart(btn.dataset.id);
    refreshCartView();
    openCart();
  });

  // Buka / tutup keranjang
  els.openCartBtn.addEventListener("click", openCart);
  els.closeCartBtn.addEventListener("click", closeCart);
  els.cartOverlay.addEventListener("click", closeCart);

  // Aksi qty & hapus di dalam keranjang
  els.cartItemsContainer.addEventListener("click", (e) => {
    const target = e.target.closest("button[data-action]");
    if (!target) return;

    const { action, id } = target.dataset;
    if (action === "inc") updateCartQty(id, 1);
    if (action === "dec") updateCartQty(id, -1);
    if (action === "remove") removeFromCart(id);

    refreshCartView();
  });

  // Checkout ke WhatsApp
  els.checkoutWaBtn.addEventListener("click", () => {
    if (!state.cart.length) return;
    const waUrl = buildWhatsAppOrderUrl();
    window.open(waUrl, "_blank", "noopener,noreferrer");
  });
}

async function init() {
  bindEvents();
  refreshCartView();

  // Set tautan konsultasi WhatsApp pada tombol header & hero
  const cleanPhone = String(CONFIG.WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");
  const consultUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Halo Admin wiwidpart+, saya ingin konsultasi sparepart BMW.")}`;
  document.getElementById("headerWaLink")?.setAttribute("href", consultUrl);
  document.getElementById("heroWaLink")?.setAttribute("href", consultUrl);

  els.catalogSummary.textContent = "Memuat katalog dari Google Sheets...";

  try {
    const csvText = await fetchCatalogCSV();
    const products = parseCSV(csvText);
    setProducts(products);
    refreshCatalogView();
  } catch (err) {
    els.catalogSummary.textContent = "Gagal memuat katalog.";
    els.catalogGrid.innerHTML = `
      <div class="empty-state">
        ${err.message || "Terjadi kesalahan saat mengambil data katalog."}
      </div>
    `;
  }
}

init();