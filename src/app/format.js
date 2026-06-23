// src/app/format.js
const SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$" };

export function currencySymbol(code) {
  return SYMBOLS[code] || (code ? code + " " : "");
}

export function money(amount, code = "INR") {
  const n = Math.round(Number(amount) || 0);
  return currencySymbol(code) + n.toLocaleString();
}

export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k";
  return String(v);
}

// Playful "that's ~X" reframes for Money Kept.
export function moneyEquivalents(amount, code = "INR") {
  const a = Number(amount) || 0;
  const out = [];
  const coffee = code === "INR" ? 250 : 5;
  const movie = code === "INR" ? 400 : 15;
  const flight = code === "INR" ? 18000 : 350;
  if (a >= coffee) out.push(`${Math.floor(a / coffee)} great coffees`);
  if (a >= movie) out.push(`${Math.floor(a / movie)} nights at the movies`);
  if (a >= flight * 0.1) out.push(`${(a / flight).toFixed(1)} of a flight home`);
  return out;
}

export function pluralize(n, word, plural) {
  return `${n} ${n === 1 ? word : plural || word + "s"}`;
}
