#!/usr/bin/env node
/** Relatório de interesse: node src/cli/relatorio.mjs [--dias 30] */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lerCliques, agregar } from "../lib/cliques.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dias = Number(process.argv.includes("--dias") ? process.argv[process.argv.indexOf("--dias") + 1] : 30);
const cat = JSON.parse(readFileSync(resolve(RAIZ, "data/catalogo.json"), "utf8"));
const nomes = new Map(cat.produtos.map((p) => [p.id, p.nome]));
const a = agregar(lerCliques(resolve(RAIZ, "data/cliques.jsonl")), dias);
const top = (lista, n = 10, fmt = (k) => k) => lista.slice(0, n).map(([k, v], i) => `${String(i + 1).padStart(2)}. ${fmt(k)} — ${v}`).join("\n") || "   (sem dados)";
console.log(`Cliques nos últimos ${dias} dias: ${a.total}\n`);
console.log(`Produtos com mais interesse:\n${top(a.porProduto, 10, (id) => nomes.get(id) || id)}\n`);
console.log(`Por loja:\n${top(a.porLoja)}\n`);
console.log(`Produto × loja:\n${top(a.porProdutoLoja)}\n`);
console.log(`Páginas de origem do clique:\n${top(a.porPagina)}\n`);
console.log(`Sites de referência (de onde o visitante veio):\n${top(a.porOrigem)}`);
