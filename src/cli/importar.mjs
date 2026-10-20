#!/usr/bin/env node
/**
 * Importa uma pesquisa do Cowork para data/catalogo.json.
 *   node src/cli/importar.mjs <arquivo-cowork.json> [--catalogo data/catalogo.json] [--simular]
 * Gera relatório em data/relatorios/. Não publica nada: depois rode `npm run build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizarPesquisa, mesclarCatalogo } from "../lib/importar.mjs";
import { canonicalizarCategoria } from "../lib/categorias.mjs";
import { validarCatalogo, resumoCatalogo, estadoOferta } from "../lib/catalogo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const entrada = process.argv[2];
if (!entrada || entrada.startsWith("--")) {
  console.error("Uso: npm run importar -- <arquivo-cowork.json> [--simular]");
  process.exit(2);
}
const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const catPath = resolve(RAIZ, arg("--catalogo", "data/catalogo.json"));
const simular = process.argv.includes("--simular");
const config = JSON.parse(readFileSync(resolve(RAIZ, "config.json"), "utf8"));
const fonte = JSON.parse(readFileSync(resolve(process.cwd(), entrada), "utf8"));
const atual = JSON.parse(readFileSync(catPath, "utf8"));

const lidos = normalizarPesquisa(fonte);
const { descartados, ignorados } = lidos;
const produtos = lidos.produtos.map((p) => ({ ...p, categoria: canonicalizarCategoria(p.categoria, config.categoriasVitrine || []) }));
const { catalogo, novos, atualizados } = mesclarCatalogo(atual, produtos);
const { erros, avisos } = validarCatalogo(catalogo, config);
const r = resumoCatalogo(catalogo, config);

const linhas = [
  `# Importação ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  ``,
  `Arquivo: \`${basename(entrada)}\` · produtos lidos: ${produtos.length} · novos: ${novos.length} · atualizados: ${atualizados.length}${simular ? " · **SIMULAÇÃO (nada gravado)**" : ""}`,
  ``,
  `Catálogo após importação: ${r.produtos} produtos, ${r.prioritarios} prioritários, ${r.comOfertaAtiva} com oferta ativa, ${r.indexaveis} indexáveis.`,
  ``,
  `## Ofertas`,
  `| Produto | Loja | Situação |`,
  `|---|---|---|`,
  ...catalogo.produtos.flatMap((p) =>
    p.ofertas.map((o) => {
      const st = estadoOferta(o, config);
      return `| ${p.nome} | ${o.loja} | ${st.ativa ? "ATIVO" : `desativado: ${st.motivo}`} |`;
    })
  ),
  ``,
  `## Erros (${erros.length})`,
  ...erros.map((e) => `- ${e}`),
  ``,
  `## Descartados (${descartados.length + ignorados.length})`,
  ...[...descartados, ...ignorados].map((d) => `- ${d}`),
  ``,
  `## Avisos (${avisos.length})`,
  ...avisos.map((a) => `- ${a}`),
];
mkdirSync(resolve(RAIZ, "data/relatorios"), { recursive: true });
const relPath = resolve(RAIZ, `data/relatorios/importacao-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.md`);
writeFileSync(relPath, linhas.join("\n") + "\n");

if (erros.length) {
  console.log(`${erros.length} erro(s) — catálogo NÃO foi alterado. Veja ${relPath}`);
  erros.slice(0, 10).forEach((e) => console.log(`ERRO: ${e}`));
  process.exit(1);
}
if (!simular) writeFileSync(catPath, JSON.stringify(catalogo, null, 2) + "\n");
console.log(`${simular ? "[simulação] " : ""}${novos.length} novos, ${atualizados.length} atualizados. ${r.comOfertaAtiva} produtos com oferta ativa.`);
console.log(`Relatório: ${relPath}`);
