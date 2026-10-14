#!/usr/bin/env node
/** Valida o catálogo: node src/cli/validar.mjs [data/catalogo.json] */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCatalogo, resumoCatalogo } from "../lib/catalogo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const caminho = process.argv.slice(2).find((a) => !a.startsWith("--")) || "data/catalogo.json";
const config = JSON.parse(readFileSync(resolve(RAIZ, "config.json"), "utf8"));
if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL;
if (process.env.AMAZON_TAG) config.afiliados = { ...config.afiliados, amazonTag: process.env.AMAZON_TAG };
const estrito = process.argv.includes("--estrito");
const catalogo = JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));
const { erros, avisos } = validarCatalogo(catalogo, config);
const r = resumoCatalogo(catalogo, config);
avisos.forEach((a) => console.log(`aviso: ${a}`));
erros.forEach((e) => console.log(`ERRO: ${e}`));
console.log(`\n${r.produtos} produtos · ${r.prioritarios} prioritários · ${r.comOfertaAtiva} com oferta ativa · ${r.indexaveis} indexáveis`);
console.log(`Ofertas por loja (ativas/total): ${Object.entries(r.porLoja).map(([l, v]) => `${l} ${v.ativas}/${v.total}`).join(" · ") || "nenhuma"}`);
console.log(erros.length ? `\n${erros.length} erro(s): o build vai falhar.` : "\nSem erros.");

// Checklist de publicação: nada disso bloqueia o build local, mas bloqueia ir para o ar.
const pendencias = [];
if (!/^https:\/\//.test(config.siteUrl || "") || /exemplo\.invalid/.test(config.siteUrl)) pendencias.push("config.siteUrl ainda é o endereço de exemplo");
if (!config.afiliados?.amazonTag) pendencias.push("config.afiliados.amazonTag não definido (e o site precisa estar cadastrado na conta de Associados)");
if (r.comOfertaAtiva === 0) pendencias.push("nenhum produto com link verificado");
if (r.indexaveis < 5) pendencias.push(`só ${r.indexaveis} página(s) de produto indexável(is) — complete descrição/pontos-chave`);
console.log(pendencias.length ? `\nPronto para publicar: NÃO\n- ${pendencias.join("\n- ")}` : "\nPronto para publicar: SIM (falta só a sua autorização)");
// --estrito: usado antes de publicar; pendência também bloqueia.
process.exit(erros.length || (estrito && pendencias.length) ? 1 : 0);
