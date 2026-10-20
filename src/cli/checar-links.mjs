#!/usr/bin/env node
/**
 * Verifica, pela rede, os links de compra ATIVOS do catálogo.
 *   node src/cli/checar-links.mjs [data/catalogo.json] [--timeout 15000]
 *
 * Para cada oferta ativa: segue os redirecionamentos (até 10) e confere se o destino
 * final é uma página de produto da loja certa — e não busca, home, login ou erro.
 * Sai com código 1 se algum link falhar. Rode antes de cada publicação comercial.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ofertasAtivas } from "../lib/catalogo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const caminho = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--timeout") || "data/catalogo.json";
const TIMEOUT = Number(args.includes("--timeout") ? args[args.indexOf("--timeout") + 1] : 15000);
const config = JSON.parse(readFileSync(resolve(RAIZ, "config.json"), "utf8"));
const catalogo = JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));

const DOMINIO = { amazon: /(^|\.)amazon\.com\.br$/, mercadolivre: /(^|\.)mercadolivre\.com\.br$/, shopee: /(^|\.)shopee\.com\.br$/ };
// Padrões de página de produto e de destinos ruins, por loja.
export const PRODUTO = {
  amazon: /\/(dp|gp\/product)\/[A-Z0-9]{10}/i,
  mercadolivre: /(\/p\/MLB\d+|MLB-?\d+)/i,
  shopee: /(-i\.\d+\.\d+|\/product\/\d+\/\d+)/i,
};
const RUIM = /\/(s|search|busca|lista)(\/|\?|$)|[?&](k|keyword|q)=|\/(login|signin|ap\/signin|jms\/|account)/i;

export const classificar = (loja, urlFinal, status) => {
  // Lojas costumam barrar robôs de datacenter: isso não prova que o link está quebrado.
  if ([403, 429, 503].includes(status)) return { ok: null, motivo: `inconclusivo: a loja bloqueou a verificação automática (HTTP ${status}); confira abrindo o link` };
  if (!status || status >= 400) return { ok: false, motivo: `HTTP ${status || "sem resposta"}` };
  let u;
  try { u = new URL(urlFinal); } catch { return { ok: false, motivo: "URL final inválida" }; }
  if (!DOMINIO[loja]?.test(u.hostname)) return { ok: false, motivo: `destino fora da loja (${u.hostname})` };
  if (RUIM.test(u.pathname + u.search) && !PRODUTO[loja].test(u.pathname)) return { ok: false, motivo: "cai em busca/login, não no produto" };
  if (!PRODUTO[loja].test(u.pathname + u.search)) return { ok: false, motivo: "destino não parece página de produto" };
  return { ok: true };
};

const seguir = async (url) => {
  const cadeia = [];
  let atual = url;
  for (let i = 0; i < 10; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(atual, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (verificador de links Vitrine Achados)", "accept-language": "pt-BR" } });
      cadeia.push(`${r.status} ${atual}`);
      const loc = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && loc) {
        atual = new URL(loc, atual).toString();
        continue;
      }
      return { status: r.status, final: atual, cadeia };
    } catch (e) {
      cadeia.push(`ERRO ${atual}: ${e.cause?.code || e.name}`);
      return { status: 0, final: atual, cadeia };
    } finally {
      clearTimeout(t);
    }
  }
  return { status: 0, final: atual, cadeia: [...cadeia, "redirecionamentos demais"] };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const alvos = catalogo.produtos.flatMap((p) => ofertasAtivas(p, config).map((o) => ({ p, o })));
  if (!alvos.length) {
    console.log("Nenhuma oferta ativa no catálogo: nada a verificar.");
    process.exit(0);
  }
  const linhas = [];
  let falhas = 0;
  let inconclusivos = 0;
  for (const { p, o } of alvos) {
    const r = await seguir(o.url);
    const c = classificar(o.loja, r.final, r.status);
    if (c.ok === false) falhas++;
    if (c.ok === null) inconclusivos++;
    linhas.push({ produto: p.id, loja: o.loja, ok: c.ok, motivo: c.motivo || "", final: r.final, cadeia: r.cadeia });
    console.log(`${c.ok ? "OK   " : c.ok === null ? "AVISO" : "FALHA"} ${p.id} · ${o.loja} → ${c.ok ? r.final : c.motivo}`);
  }
  mkdirSync(resolve(RAIZ, "data/relatorios"), { recursive: true });
  const rel = resolve(RAIZ, `data/relatorios/links-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
  writeFileSync(rel, JSON.stringify(linhas, null, 2));
  console.log(`\n${alvos.length - falhas - inconclusivos} OK · ${inconclusivos} inconclusivo(s) · ${falhas} falha(s) de ${alvos.length}. Relatório: ${rel}`);
  process.exit(falhas ? 1 : 0);
}
