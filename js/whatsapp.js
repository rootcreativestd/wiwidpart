import { CONFIG } from "./config.js";
import { formatIDR } from "./render.js";
import { getCartSubtotal, state } from "./state.js";

export function buildWhatsAppOrderUrl() {
  if (!state.cart.length) return "#";

  const lines = [
    "Halo Admin *wiwidpart+*, saya ingin memesan sparepart BMW berikut:",
    ""
  ];

  state.cart.forEach((item, index) => {
    const chassisText = item.chassis_codes?.length ? item.chassis_codes.join(", ") : "-";
    const itemSubtotal = item.price * item.qty;

    lines.push(`${index + 1}. *${item.part_name}*`);
    lines.push(`   - Merek: ${item.brand}`);
    lines.push(`   - Grade: ${item.grade}`);
    lines.push(`   - Kode Sasis: ${chassisText}`);
    lines.push(`   - OEM Number: ${item.oem_number}`);
    lines.push(`   - Qty: ${item.qty} x ${formatIDR(item.price)} = ${formatIDR(itemSubtotal)}`);
    lines.push("");
  });

  const grandTotal = getCartSubtotal();
  lines.push(`*Estimasi Total: ${formatIDR(grandTotal)}*`);
  lines.push("Mohon konfirmasi ketersediaan stok & ongkos kirim. Terima kasih.");

  const encodedText = encodeURIComponent(lines.join("\n"));
  const cleanPhone = String(CONFIG.WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");

  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}