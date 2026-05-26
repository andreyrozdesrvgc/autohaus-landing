// Phone number utilities for Russian format: +7 (XXX) XXX-XX-XX
// Always 11 digits total, must start with +7. Supports paste of 8XXX or 7XXX.

export function digitsOnly(value) {
  return (value || "").replace(/\D/g, "");
}

/** Normalise to a maximum-11-digit string starting with 7. */
export function normaliseRuDigits(value) {
  let d = digitsOnly(value);
  if (d.length === 0) return "";
  // If user typed 8-prefix, swap to 7 (RU convention).
  if (d[0] === "8") d = "7" + d.slice(1);
  // If user typed 9 (no country code), prepend 7.
  if (d[0] !== "7") d = "7" + d;
  return d.slice(0, 11);
}

/** Format to "+7 (XXX) XXX-XX-XX" using whatever digits are available. */
export function formatRuPhone(value) {
  const d = normaliseRuDigits(value);
  if (!d) return "";
  // d always starts with 7 by construction.
  const rest = d.slice(1); // up to 10 digits
  const p1 = rest.slice(0, 3);
  const p2 = rest.slice(3, 6);
  const p3 = rest.slice(6, 8);
  const p4 = rest.slice(8, 10);
  let out = "+7";
  if (p1) out += ` (${p1}`;
  if (p1.length === 3) out += ")";
  if (p2) out += ` ${p2}`;
  if (p3) out += `-${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

export function isValidRuPhone(value) {
  const d = digitsOnly(value);
  return d.length === 11 && d[0] === "7";
}
