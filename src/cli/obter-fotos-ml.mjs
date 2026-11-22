#!/usr/bin/env node
/**
 * Preenche data/imagens.json com a foto oficial do catálogo do Mercado Livre
 * quando a API pública devolve uma URL do CDN mlstatic. Não baixa o arquivo.
 * Token opcional: ML_ACCESS_TOKEN (a API passou a exigir Authorization).
 *
 *   node src/cli/obter-fotos-ml.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buscarImagemCatalogoMl, FONTE_ML } from "../lib/ml-imagens.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const caminho = resolve(RAIZ, "data/imagens.json");
const reg = JSON.parse(readFileSync(caminho, "utf8"));
const token = process.env.ML_ACCESS_TOKEN || "";
let mudou = 0;
let falhas = 0;

for (const [id, e] of Object.entries(reg.produtos || {})) {
  if (e.loja !== "mercadolivre" || e.url) continue;
  const r = await buscarImagemCatalogoMl(e.identificacao, { token });
  if (!r.url) {
    falhas++;
    console.log(`SEM FOTO ${id} (${e.identificacao}): ${r.erro || "sem url"}`);
    continue;
  }
  e.url = r.url;
  e.fonte = FONTE_ML;
  e.autorizacao = "condicional";
  e.condicao = {
    loja: "mercadolivre",
    motivo: "Válida enquanto o Mercado Livre estiver ativo no site (programa confirmado por escrito em 21/10/2026)",
  };
  e.evidencia = `Imagem oficial do catálogo ${e.identificacao} devolvida pela API pública de produtos do Mercado Livre em ${new Date().toISOString().slice(0, 10)} (CDN mlstatic, hotlink). A mesma CDN é a das fotos já autorizadas pela resposta do caso 490066167.`;
  mudou++;
  console.log(`FOTO ${id}: ${r.url}`);
}

if (mudou) {
  reg.atualizadoEm = new Date().toISOString().slice(0, 10);
  writeFileSync(caminho, `${JSON.stringify(reg, null, 2)}\n`);
}
console.log(`\n${mudou} foto(s) gravada(s) como hotlink, ${falhas} sem foto. Nenhum arquivo foi baixado.`);
process.exit(falhas && !mudou ? 1 : 0);
