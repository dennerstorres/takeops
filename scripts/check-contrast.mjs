// Confere contraste WCAG AA dos pares de tokens de globals.css nos temas
// claro e escuro: 4.5:1 para texto, 3:1 para anel de foco.
// Uso: node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

function block(selector) {
  const start = css.indexOf(`\n${selector} {`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const vars = {};
  for (const [, name, value] of body.matchAll(
    /--([\w-]+):\s*oklch\(([^)]*)\)/g,
  )) {
    vars[name] = value;
  }
  return vars;
}

// OKLCH → sRGB linear (Björn Ottosson) → luminância relativa WCAG.
function luminance(value) {
  const [l, c, h] = value.split("/")[0].trim().split(/\s+/).map(Number);
  const rad = ((h || 0) * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ].map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const text = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "card"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["primary", "background"],
  ["destructive-foreground", "destructive"],
  ["destructive", "background"],
  ["destructive", "destructive-muted"],
  ["success-foreground", "success"],
  ["success", "success-muted"],
  ["warning-foreground", "warning"],
  ["warning", "warning-muted"],
  ["info-foreground", "info"],
  ["info", "info-muted"],
  ["record-foreground", "record"],
  ["frame-foreground", "frame"],
  ["divider-foreground", "divider"],
  ...["plan", "set", "post", "done", "shelf"].flatMap((phase) => [
    ["strip-ink", `strip-${phase}`],
    ["strip-ink-muted", `strip-${phase}`],
  ]),
];
const focus = [["ring", "background"]];

let failed = 0;
for (const theme of [":root", ".dark"]) {
  const vars = block(theme);
  for (const [pairs, min] of [
    [text, 4.5],
    [focus, 3],
  ]) {
    for (const [fg, bg] of pairs) {
      const value = ratio(vars[fg], vars[bg]);
      if (value < min) failed++;
      console.log(
        `${value >= min ? "ok  " : "FAIL"} ${theme} ${fg} / ${bg}: ${value.toFixed(2)}`,
      );
    }
  }
}
process.exit(failed ? 1 : 0);
