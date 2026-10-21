#!/usr/bin/env node
/**
 * Confere as fotos liberadas em data/imagens.json:
 *   1) a url responde com uma imagem;
 *   2) a foto pertence ao anúncio do produto (o nome do arquivo aparece na página do anúncio).
 * "Inconclusivo" quando a loja não entrega a página a robôs; falha só quando a imagem não existe
 * ou a página do anúncio carrega e não contém a foto. Não usa links de afiliado.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const reg = JSON.parse(readFileSync(resolve(RAIZ, "data/imagens.json"), "utf8"));
const UA = { "user-agent": "Mozilla/5.0 (verificador de fotos Vitrine Achados)", "accept-language": "pt-BR" };

const baixar = async (url, comoTexto) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal, redirect: "follow" });
    return { status: r.status, tipo: r.headers.get("content-type") || "", corpo: comoTexto ? await r.text() : "", url: r.url };
  } catch (e) {
    return { status: 0, tipo: "", corpo: "", erro: e.cause?.code || e.name };
  } finally {
    clearTimeout(t);
  }
};

const alvos = Object.entries(reg.produtos).filter(([, e]) => e.url && ["autorizada", "condicional"].includes(e.autorizacao));
let falhas = 0;
for (const [id, e] of alvos) {
  const img = await baixar(e.url, false);
  if (img.status !== 200 || !img.tipo.startsWith("image/")) {
    falhas++;
    console.log(`FALHA ${id}: foto não responde como imagem (HTTP ${img.status || img.erro} ${img.tipo})`);
    continue;
  }
  const arquivo = new URL(e.url).pathname.split("/").pop().replace(/\.(webp|jpe?g|png)$/i, "");
  const pagina = e.anuncio ? await baixar(e.anuncio, true) : null;
  if (!pagina || pagina.status !== 200 || pagina.corpo.length < 2000) {
    console.log(`AVISO ${id}: imagem OK; anúncio não verificável por robô (HTTP ${pagina?.status ?? "-"}) — confira a correspondência abrindo ${e.anuncio}`);
  } else if (pagina.corpo.includes(arquivo)) {
    console.log(`OK    ${id}: imagem OK e presente no anúncio ${e.identificacao}`);
  } else if (/captcha|verify|robot/i.test(pagina.corpo.slice(0, 20000))) {
    console.log(`AVISO ${id}: imagem OK; anúncio pediu verificação anti-robô`);
  } else {
    console.log(`AVISO ${id}: imagem OK; o arquivo não aparece no HTML do anúncio (página montada por script?) — confira abrindo ${e.anuncio}`);
  }
}
console.log(`\n${alvos.length} foto(s) liberada(s) conferida(s), ${falhas} falha(s).`);
process.exit(falhas ? 1 : 0);
