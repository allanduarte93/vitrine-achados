#!/usr/bin/env node
/**
 * Avisa os buscadores participantes do IndexNow (Bing, Yandex, Seznam, Naver...)
 * sobre as URLs do sitemap publicado.
 *   node src/cli/indexnow.mjs [--sitemap https://.../sitemap.xml] [--seco]
 * Usa a chave de static/<chave>.txt (servida na raiz do site).
 */
import { readdirSync, readFileSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const config = JSON.parse(readFileSync(resolve(RAIZ, "config.json"), "utf8"));
const siteUrl = String(process.env.SITE_URL || config.siteUrl).replace(/\/+$/, "");
const chaveArq = readdirSync(resolve(RAIZ, "static")).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!chaveArq) { console.error("Chave IndexNow não encontrada em static/"); process.exit(1); }
const key = readFileSync(resolve(RAIZ, "static", chaveArq), "utf8").trim();
const sitemap = opt("--sitemap", `${siteUrl}/sitemap.xml`);
const resumo = (t) => { console.log(t); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, t + "\n"); };

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let xml = "";
for (let i = 0; i < 6; i++) {
  const r = await fetch(sitemap, { cache: "no-store" }).catch(() => null);
  if (r && r.ok) { xml = await r.text(); break; }
  await esperar(10000); // o Pages pode levar alguns segundos para servir a nova versão
}
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) { resumo("IndexNow: sitemap vazio ou inacessível; nada enviado."); process.exit(1); }
const host = new URL(siteUrl).host;
const corpo = { host, key, keyLocation: `${siteUrl}/${chaveArq}`, urlList: urls };
if (args.includes("--seco")) { resumo(`IndexNow (seco): ${urls.length} URLs prontas para ${host}`); process.exit(0); }
const r = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(corpo) });
resumo(`IndexNow: ${urls.length} URLs enviadas → HTTP ${r.status} ${r.statusText}`);
process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
