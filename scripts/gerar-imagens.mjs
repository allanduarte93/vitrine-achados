#!/usr/bin/env node
/**
 * Gera os PNGs de marca a partir dos SVGs originais (uso de desenvolvimento).
 *   node scripts/gerar-imagens.mjs
 * Requer Playwright + Chromium instalados na máquina (não é dependência do site).
 * Saída: assets/icon-192.png, icon-512.png, apple-touch-icon.png, og-image.png
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marcaSvg, heroSvg } from "../src/lib/icones.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pw = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const { chromium } = pw.default || pw;
const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const fonte = (w) => `@font-face{font-family:J;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(resolve(RAIZ, `assets/fonts/plus-jakarta-sans-latin-${w}-normal.woff2`)).toString("base64")})}`;

const foto = async (html, largura, altura, arquivo) => {
  const p = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await p.setContent(html, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: resolve(RAIZ, "assets", arquivo), omitBackground: false });
  await p.close();
  console.log("gerado", arquivo);
};

for (const [lado, arq] of [[192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"]]) {
  await foto(`<body style="margin:0;background:#fff;display:grid;place-items:center;height:100vh">${marcaSvg(lado).replace('viewBox="0 0 48 48"', 'viewBox="2 2 44 44"')}</body>`, lado, lado, arq);
}

await foto(`<html><head><style>${fonte(800)}${fonte(700)}${fonte(500)}
body{margin:0;width:1200px;height:630px;font-family:J,Arial,sans-serif;background:radial-gradient(900px 420px at 90% 0%,#ffe2d4,transparent 60%),linear-gradient(180deg,#fff,#fff6f1);display:grid;grid-template-columns:1.05fr .95fr;align-items:center;overflow:hidden}
.t{padding:0 0 0 72px}.logo{display:flex;align-items:center;gap:16px}.logo b{font-size:44px;font-weight:800;color:#14215a;letter-spacing:-1.5px;display:block;line-height:1}.logo span{font-size:19px;font-weight:700;color:#c2410c;letter-spacing:4px}
h1{font-size:58px;line-height:1.08;color:#14215a;letter-spacing:-2px;margin:38px 0 18px}h1 em{font-style:normal;color:#c2410c}
p{font-size:24px;color:#545e7c;margin:0;font-weight:500}svg.hero-arte{width:560px}
</style></head><body><div class="t"><div class="logo">${marcaSvg(72)}<div><b>vitrine</b><span>ACHADOS</span></div></div>
<h1>Os achados mais procurados, <em>em um só lugar</em>.</h1><p>Amazon · Mercado Livre · Shopee</p></div><div>${heroSvg()}</div></body></html>`, 1200, 630, "og-image.png");

await navegador.close();
