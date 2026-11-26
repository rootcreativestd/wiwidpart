import { CONFIG } from "./config.js";

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(cart) {
  try {
    localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Abaikan jika storage penuh/diblokir
  }
}

export const state = {
  products: [],
  filters: {
    search: "",
    category: "ALL",
    chassis: "ALL"
  },
  cart: loadCartFromStorage()
};

export function setProducts(products) {
  state.products = products;
}

export function updateFilters(partialFilters) {
  state.filters = {
    ...state.filters,
    ...partialFilters
  };
}

export function resetFilters() {
  state.filters = {
    search: "",
    category: "ALL",
    chassis: "ALL"
  };
}

export function getFilteredProducts() {
  const query = state.filters.search.trim().toLowerCase();
  const selectedCategory = state.filters.category;
  const selectedChassis = state.filters.chassis;

  return state.products.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;

    const matchesChassis =
      selectedChassis === "ALL" ||
      item.chassis_codes.includes(selectedChassis.toUpperCase());

    const matchesSearch =
      !query ||
      item.part_name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.oem_number.toLowerCase().includes(query) ||
      item.engine_codes.some((eng) => eng.toLowerCase().includes(query)) ||
      item.chassis_codes.some((chs) => chs.toLowerCase().includes(query));

    return matchesCategory && matchesChassis && matchesSearch;
  });
}

export function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product || product.stock_status.toLowerCase() === "habis") return;

  const existing = state.cart.find((c) => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: product.id,
      part_name: product.part_name,
      brand: product.brand,
      grade: product.grade,
      oem_number: product.oem_number,
      chassis_codes: product.chassis_codes,
      price: product.price,
      qty: 1
    });
  }

  saveCartToStorage(state.cart);
}

export function updateCartQty(productId, delta) {
  const target = state.cart.find((c) => c.id === productId);
  if (!target) return;

  target.qty += delta;
  if (target.qty <= 0) {
    state.cart = state.cart.filter((c) => c.id !== productId);
  }

  saveCartToStorage(state.cart);
}

export function removeFromCart(productId) {
  state.cart = state.cart.filter((c) => c.id !== productId);
  saveCartToStorage(state.cart);
}

export function getCartTotalCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

export function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}