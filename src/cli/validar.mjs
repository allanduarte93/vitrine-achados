#!/usr/bin/env node
/**
 * Valida o catálogo e diz se o site pode ir para o ar.
 *   node src/cli/validar.mjs [data/catalogo.json] [--config config.json] [--estrito]
 * --estrito (npm run pronto): sai com erro se houver pendência de publicação.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCatalogo, avaliarPublicacao, somenteConfirmadas } from "../lib/catalogo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const caminho = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--config") || "data/catalogo.json";
const config = JSON.parse(readFileSync(resolve(RAIZ, opt("--config", "config.json")), "utf8"));
if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL;
if (process.env.AMAZON_TAG) config.afiliados = { ...config.afiliados, amazonTag: process.env.AMAZON_TAG };
const lido = JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));
const recorte = process.env.SOMENTE_CONFIRMADOS === "1";
const catalogo = recorte ? somenteConfirmadas(lido, config) : lido;
if (recorte) {
  const fora = {};
  lido.produtos.forEach((p) => p.ofertas.forEach((o) => { if (config.afiliados?.programasConfirmados?.[o.loja] !== true) fora[o.loja] = (fora[o.loja] || 0) + 1; }));
  console.log(`Publicação só com lojas confirmadas. Fora até a confirmação: ${Object.entries(fora).map(([l, n]) => `${l} (${n} ofertas)`).join(", ") || "nenhuma"}`);
}

const { erros, avisos } = validarCatalogo(catalogo, config);
const { modo, pendencias, observacoes, resumo: r } = avaliarPublicacao(catalogo, config);
avisos.forEach((a) => console.log(`aviso: ${a}`));
erros.forEach((e) => console.log(`ERRO: ${e}`));
console.log(`\n${r.produtos} produtos · ${r.prioritarios} prioritários · ${r.comOfertaAtiva} com oferta ativa · ${r.indexaveis} indexáveis`);
console.log(`Ofertas por loja (ativas/total): ${Object.entries(r.porLoja).map(([l, v]) => `${l} ${v.ativas}/${v.total}`).join(" · ") || "nenhuma"}`);
console.log(`Modo de publicação: ${modo}`);
observacoes.forEach((o) => console.log(`- ${o}`));
console.log(pendencias.length ? `\nPronto para publicar: NÃO\n- ${pendencias.join("\n- ")}` : "\nPronto para publicar: SIM (falta só a sua autorização)");
process.exit(erros.length || (args.includes("--estrito") && pendencias.length) ? 1 : 0);
