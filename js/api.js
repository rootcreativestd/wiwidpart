import { CONFIG } from "./config.js";

export async function fetchCatalogCSV() {
  if (!CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL.includes("GANTI_DENGAN_ID_CSV_PUBLIKASI")) {
    throw new Error("URL CSV Google Sheets belum dikonfigurasi di js/config.js.");
  }

  const separator = CONFIG.SHEET_CSV_URL.includes("?") ? "&" : "?";
  const cacheBusterUrl = `${CONFIG.SHEET_CSV_URL}${separator}_t=${Date.now()}`;

  const response = await fetch(cacheBusterUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat data CSV (HTTP ${response.status}).`);
  }

  return await response.text();
}

export function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  const cleanText = csvText.replace(/^\uFEFF/, "");

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else if (char === "\r" && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const products = [];

  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = values[idx] !== undefined ? values[idx].trim() : "";
    });

    if (!item.id && !item.part_name) continue;

    const numericPrice = Number(String(item.price || "0").replace(/[^\d]/g, "")) || 0;

    const chassisList = String(item.chassis_codes || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const engineList = String(item.engine_codes || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    products.push({
      id: item.id || `PART-${r}`,
      category: item.category || "Engine & Cooling",
      part_name: item.part_name || "Tanpa Nama Part",
      brand: item.brand || "-",
      grade: item.grade || "Aftermarket",
      oem_number: item.oem_number || "-",
      chassis_codes: chassisList,
      engine_codes: engineList,
      price: numericPrice,
      stock_status: item.stock_status || "Ready",
      image_url: item.image_url || CONFIG.FALLBACK_IMAGE,
      notes: item.notes || ""
    });
  }

  return products;
}