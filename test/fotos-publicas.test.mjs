import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../src/build.mjs";
import { aplicarRegistroImagens, imagemValida, ehCdnAmazon } from "../src/lib/imagens.mjs";
import { aplicarImagensAmazonNoCatalogo, buscarImagensAmazon, FONTE_AMAZON } from "../src/lib/amazon-imagens.mjs";
import { urlImagemCatalogoMl } from "../src/lib/ml-imagens.mjs";
import { cardProduto } from "../src/lib/render.mjs";

for (const v of ["AMAZON_CREATORS_CREDENTIAL_ID", "AMAZON_CREATORS_CREDENTIAL_SECRET", "AMAZON_CREATORS_VERSION", "SOMENTE_CONFIRMADOS"]) delete process.env[v];

const foto = (extra = {}) => ({ imagem: "https://exemplo.invalid/fotos/a.webp", imagemPermitida: true, imagemFonte: "fixture", ...extra });

test("imagem válida exige autorização, fonte e URL https de imagem", () => {
  assert.equal(imagemValida(foto()), true);
  assert.equal(imagemValida({ imagem: "/assets/produtos/a.webp", imagemPermitida: true, imagemFonte: "arquivo próprio" }), true);
  assert.equal(imagemValida(foto({ imagemPermitida: false })), false);
  assert.equal(imagemValida(foto({ imagemFonte: "  " })), false);
  assert.equal(imagemValida(foto({ imagem: "http://exemplo.invalid/a.webp" })), false);
  assert.equal(imagemValida(foto({ imagem: "https://exemplo.invalid/sem-extensao" })), false);
  assert.equal(ehCdnAmazon("https://m.media-amazon.com/images/I/41x._SL500_.jpg"), true);
});

test("registro não publica link gravado do CDN da Amazon", () => {
  const cat = { produtos: [{ id: "amazon-b000000001", nome: "X", ofertas: [{ loja: "amazon", identificador: "B000000001" }] }] };
  const reg = { produtos: { "amazon-b000000001": { loja: "amazon", identificacao: "B000000001", url: "https://m.media-amazon.com/images/I/41x._SL500_.jpg", fonte: "API", autorizacao: "autorizada" } } };
  const r = aplicarRegistroImagens(cat, reg, { afiliados: { programasConfirmados: { amazon: true } } }, { publicacao: true });
  assert.equal(r.catalogo.produtos[0].imagem, undefined);
  assert.ok(r.avisos.some((a) => /não fica gravado/.test(a)));
});

test("Creators API: sem credencial não chama a rede; com mock, só hotlink e a imagem aponta para a Amazon", async () => {
  const sem = await buscarImagensAmazon({ asins: ["B000000001"], partnerTag: "vitrineachados-20", env: {}, fetchImpl: () => { throw new Error("não devia buscar"); } });
  assert.deepEqual(sem.mapa, {});
  assert.match(sem.avisos.join(" "), /sem credencial/);

  const chamadas = [];
  const fetchImpl = async (url) => {
    chamadas.push(url);
    if (String(url).includes("/auth/o2/token")) return { ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) };
    return { ok: true, json: async () => ({ itemsResult: { items: [{ asin: "B000000001", images: { primary: { large: { url: "https://m.media-amazon.com/images/I/41abc._SL500_.jpg", width: 500, height: 400 } } } }] } }) };
  };
  const com = await buscarImagensAmazon({ asins: ["B000000001"], partnerTag: "vitrineachados-20", env: { AMAZON_CREATORS_CREDENTIAL_ID: "id", AMAZON_CREATORS_CREDENTIAL_SECRET: "sec", AMAZON_CREATORS_VERSION: "3.1" }, fetchImpl });
  assert.equal(com.mapa.B000000001.url, "https://m.media-amazon.com/images/I/41abc._SL500_.jpg");
  assert.equal(com.mapa.B000000001.width, 500);
  assert.ok(chamadas.every((u) => !String(u).includes("m.media-amazon.com")), "o arquivo da imagem não é baixado");

  const url = "https://www.amazon.com.br/dp/B000000001?tag=vitrineachados-20";
  const cat = aplicarImagensAmazonNoCatalogo({ produtos: [{ id: "p", nome: "Echo", imagemFonte: "", ofertas: [{ loja: "amazon", identificador: "B000000001", url }] }] }, com.mapa);
  assert.equal(cat.produtos[0].imagemFonte, FONTE_AMAZON);
  assert.equal(cat.produtos[0].imagemLinkLoja, "amazon");
  const html = cardProduto(cat.produtos[0], [{ loja: "amazon", url, estado: {} }]);
  assert.match(html, /<img src="https:\/\/m\.media-amazon\.com\/images\/I\/41abc\._SL500_\.jpg" alt="Echo" width="500" height="400" loading="lazy"/);
  assert.match(html, new RegExp(`href="${url.replaceAll("?", "\\?")}" target="_blank" rel="sponsored nofollow noopener"`));
  assert.equal(cardProduto({ id: "s", nome: "Sem", ofertas: [] }, []), "");
});

test("Mercado Livre: só aceita URL https do CDN oficial", () => {
  assert.equal(urlImagemCatalogoMl({ pictures: [{ url: "http://http2.mlstatic.com/D_1.jpg" }] }), null);
  assert.equal(urlImagemCatalogoMl({ pictures: [{ secure_url: "https://cdn.exemplo.invalid/a.jpg" }] }), null);
  assert.equal(urlImagemCatalogoMl({ pictures: [{ secure_url: "https://http2.mlstatic.com/D_Q_NP_2X_1-MLA1-AB.webp" }] }), "https://http2.mlstatic.com/D_Q_NP_2X_1-MLA1-AB.webp");
});

test("build público: nenhum card, busca ou página de produto sem imagem", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-sem-foto-"));
  process.env.SOMENTE_CONFIRMADOS = "1";
  try {
    const r = build({ catalogoPath: "data/catalogo.json", saida, agora: new Date("2026-11-22T12:00:00-03:00") });
    assert.ok(r.omitidosSemFoto.length >= 1);
    const arquivos = [];
    const varrer = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? varrer(join(d, e.name)) : e.name.endsWith(".html") && arquivos.push(join(d, e.name))));
    varrer(saida);
    const html = arquivos.map((f) => readFileSync(f, "utf8")).join("\n");
    assert.doesNotMatch(html, /class="sem-foto|class="rec"|Sem foto autorizada|Sem foto aqui/);
    const cards = html.match(/<article class="card[^"]*"[\s\S]*?<\/article>/g) || [];
    assert.ok(cards.length > 0);
    for (const card of cards) {
      assert.match(card, /<img src="https:[^"]+" alt="[^"]{3,}" width="\d+" height="\d+" (?:loading="lazy"|fetchpriority="high")/);
    }
    const guias = html.match(/<div class="guia-prod-inline">[\s\S]*?<\/div>\s*<\/div>/g) || [];
    for (const bloco of guias) assert.match(bloco, /<img src="https:[^"]+" alt="[^"]+" width="\d+" height="\d+" loading="lazy"/);
    const busca = JSON.parse(readFileSync(join(saida, "busca.json"), "utf8")).produtos;
    assert.ok(busca.length > 0);
    for (const p of busca) {
      assert.match(p.imagem, /^https:\/\/.+\.(webp|jpe?g|png|gif|avif)(\?|$)/i);
      assert.equal(existsSync(join(saida, "produto", p.id, "index.html")), true);
    }
    for (const p of r.omitidosSemFoto) {
      assert.equal(busca.some((x) => x.id === p.id), false, p.id);
      assert.equal(existsSync(join(saida, "produto", p.id, "index.html")), false, p.id);
      assert.doesNotMatch(html, new RegExp(`/produto/${p.id}/`));
    }
    assert.equal(existsSync(join(saida, "produto", "amazon-b0cp31qs6r", "index.html")), false);
    assert.equal(existsSync(join(saida, "produto", "amazon-b0cfpl6cfy", "index.html")), false);
    assert.equal(existsSync(join(saida, "produto", "amazon-b0dd1kd5jp", "index.html")), false);
  } finally {
    delete process.env.SOMENTE_CONFIRMADOS;
    rmSync(saida, { recursive: true, force: true });
  }
});
