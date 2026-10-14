import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validarLinkAfiliado, normalizarLoja } from "../src/lib/links.mjs";
import { estadoOferta, validarCatalogo, produtoIndexavel } from "../src/lib/catalogo.mjs";
import { normalizarPesquisa, mesclarCatalogo } from "../src/lib/importar.mjs";
import { normalizarClique, agregar } from "../src/lib/cliques.mjs";
import { build } from "../src/build.mjs";
import { criarServidor } from "../src/server.mjs";

const AGORA = new Date("2026-10-14T18:00:00-03:00");
const CONFIG = { siteUrl: "https://site.test", afiliados: { amazonTag: null }, precoValidadeHoras: 24 };
const V = { linkVerificado: true, verificadoEm: "2026-10-14" };

test("links: aceita formatos de afiliado e recusa os demais", () => {
  assert.equal(validarLinkAfiliado("amazon", "https://www.amazon.com.br/dp/B0X?tag=abc-20").ok, true);
  assert.equal(validarLinkAfiliado("amazon", "https://amzn.to/3abc").ok, true);
  assert.equal(validarLinkAfiliado("amazon", "https://www.amazon.com.br/dp/B0X").ok, false);
  assert.equal(validarLinkAfiliado("amazon", "https://www.amazon.com.br/dp/B0X?tag=outra-20", { amazonTag: "abc-20" }).ok, false);
  assert.equal(validarLinkAfiliado("amazon", "https://amazon.com.br.golpe.com/dp/B0X?tag=a").ok, false);
  assert.equal(validarLinkAfiliado("mercadolivre", "https://mercadolivre.com/sec/1abc").ok, true);
  assert.equal(validarLinkAfiliado("mercadolivre", "https://meli.la/1abc").ok, true);
  assert.equal(validarLinkAfiliado("mercadolivre", "https://produto.mercadolivre.com.br/MLB-1?matt_tool=123").ok, true);
  assert.equal(validarLinkAfiliado("mercadolivre", "https://lista.mercadolivre.com.br/perfume").ok, false);
  assert.equal(validarLinkAfiliado("shopee", "https://s.shopee.com.br/abc").ok, true);
  assert.equal(validarLinkAfiliado("shopee", "https://shopee.com.br/search?keyword=x").ok, false);
  assert.equal(validarLinkAfiliado("shopee", "http://s.shopee.com.br/abc").ok, false);
  assert.equal(normalizarLoja("Mercado Livre"), "mercadolivre");
  assert.equal(normalizarLoja("", "https://s.shopee.com.br/x"), "shopee");
});

test("oferta: botão só ativa com link válido e verificado com data", () => {
  const url = "https://s.shopee.com.br/abc";
  assert.equal(estadoOferta({ loja: "shopee", url }, CONFIG, AGORA).ativa, false);
  assert.equal(estadoOferta({ loja: "shopee", url, linkVerificado: true }, CONFIG, AGORA).ativa, false);
  assert.equal(estadoOferta({ loja: "shopee", url, ...V }, CONFIG, AGORA).ativa, true);
});

test("preço: nunca da Amazon; só com data recente e não futura", () => {
  const amz = { loja: "amazon", url: "https://amzn.to/x", ...V, preco: 99, precoColetadoEm: "2026-10-14T12:00:00-03:00" };
  assert.equal(estadoOferta(amz, CONFIG, AGORA).mostrarPreco, false);
  const base = { loja: "shopee", url: "https://s.shopee.com.br/x", ...V, preco: 99 };
  assert.equal(estadoOferta({ ...base, precoColetadoEm: "2026-10-14T12:00:00-03:00" }, CONFIG, AGORA).mostrarPreco, true);
  assert.equal(estadoOferta({ ...base, precoColetadoEm: "2026-10-12T12:00:00-03:00" }, CONFIG, AGORA).mostrarPreco, false);
  assert.equal(estadoOferta({ ...base, precoColetadoEm: "2026-10-15T12:00:00-03:00" }, CONFIG, AGORA).mostrarPreco, false);
  assert.equal(estadoOferta(base, CONFIG, AGORA).mostrarPreco, false);
});

test("catálogo: recusa avaliações, ids duplicados e mais de 10 prioritários", () => {
  const p = (id, extra = {}) => ({ id, nome: `Produto ${id}`, categoria: "Casa", ofertas: [], ...extra });
  assert.ok(validarCatalogo({ produtos: [p("a", { avaliacao: 4.9 })] }, CONFIG).erros.some((e) => /não permitido/.test(e)));
  assert.ok(validarCatalogo({ produtos: [p("a"), p("a")] }, CONFIG).erros.some((e) => /duplicado/.test(e)));
  const onze = Array.from({ length: 11 }, (_, i) => p(`p${i}`, { prioritario: true }));
  assert.ok(validarCatalogo({ produtos: onze }, CONFIG).erros.some((e) => /prioritários/.test(e)));
  assert.equal(validarCatalogo({ produtos: [p("a")] }, CONFIG).erros.length, 0);
});

test("indexação: exige oferta ativa e conteúdo próprio", () => {
  const oferta = { loja: "shopee", url: "https://s.shopee.com.br/x", ...V };
  const base = { id: "a", nome: "A", categoria: "Casa", ofertas: [oferta] };
  assert.equal(produtoIndexavel({ ...base, descricao: "curta" }, CONFIG, AGORA), false);
  assert.equal(produtoIndexavel({ ...base, pontosChave: ["1", "2", "3"] }, CONFIG, AGORA), true);
  assert.equal(produtoIndexavel({ ...base, ofertas: [{ ...oferta, linkVerificado: false }], pontosChave: ["1", "2", "3"] }, CONFIG, AGORA), false);
});

test("importação: lê formatos variados sem inventar verificação nem preço", () => {
  const fonte = {
    produtos: [
      { nome: "Fone X", marca: "M", categoria: "Eletrônicos", prioridade: 1, ofertas: [{ plataforma: "Shopee", link: "https://s.shopee.com.br/a", validado: "sim", verificadoEm: "2026-10-14", preco: "R$ 59,90" }] },
      { name: "Panela Y", category: "Casa", amazon: { url: "https://amzn.to/b", verified: true }, link_shopee: "https://s.shopee.com.br/c", rating: 5 },
      { produto: "Garrafa Z", plataforma: "Mercado Livre", link: "https://meli.la/d", status: "validado", validadoEm: "2026-10-13" },
      { produto: "Garrafa Z", plataforma: "Amazon", link: "https://amzn.to/e" },
    ],
  };
  const { produtos, descartados } = normalizarPesquisa(fonte);
  assert.equal(produtos.length, 3);
  const fone = produtos.find((p) => p.nome === "Fone X");
  assert.equal(fone.prioritario, true);
  assert.equal(fone.ofertas[0].linkVerificado, true);
  assert.equal(fone.ofertas[0].preco, undefined, "preço sem data de coleta é descartado");
  const panela = produtos.find((p) => p.nome === "Panela Y");
  assert.equal(panela.ofertas.find((o) => o.loja === "amazon").linkVerificado, false, "verificado sem data não conta");
  assert.equal(panela.ofertas.find((o) => o.loja === "shopee").linkVerificado, false);
  assert.ok(descartados.some((d) => /rating/.test(d)));
  assert.ok(descartados.some((d) => /preço descartado/.test(d)));
  const garrafa = produtos.find((p) => p.nome === "Garrafa Z");
  assert.deepEqual(garrafa.ofertas.map((o) => [o.loja, o.linkVerificado]).sort(), [["amazon", false], ["mercadolivre", true]]);
});

test("importação: data do arquivo vale para verificação; mescla preserva edição manual", () => {
  const { produtos } = normalizarPesquisa({ dataValidacao: "2026-10-14", itens: [{ nome: "Item", categoria: "Casa", shopee: { url: "https://s.shopee.com.br/x", validado: true } }] });
  assert.equal(produtos[0].ofertas[0].verificadoEm, "2026-10-14");
  const existente = { produtos: [{ id: produtos[0].id, nome: "Item", categoria: "Casa", descricao: "Texto editado à mão", ofertas: [{ loja: "shopee", url: "https://s.shopee.com.br/x", ...V }] }] };
  const rebaixado = [{ ...produtos[0], ofertas: [{ loja: "shopee", url: "https://s.shopee.com.br/x", linkVerificado: false }] }];
  const { catalogo } = mesclarCatalogo(existente, rebaixado);
  assert.equal(catalogo.produtos[0].descricao, "Texto editado à mão");
  assert.equal(catalogo.produtos[0].ofertas[0].linkVerificado, true, "não rebaixa link já verificado");
});

test("cliques: filtra robôs e dados inválidos; agrega por produto e loja", () => {
  const ok = { produto: "fone-x", loja: "shopee", pagina: "/produto/fone-x/" };
  assert.ok(normalizarClique(ok, "Mozilla/5.0", new Set(["fone-x"]), AGORA));
  assert.equal(normalizarClique(ok, "Googlebot/2.1", null, AGORA), null);
  assert.equal(normalizarClique({ ...ok, loja: "ebay" }, "Mozilla/5.0", null, AGORA), null);
  assert.equal(normalizarClique({ ...ok, produto: "<script>" }, "Mozilla/5.0", null, AGORA), null);
  assert.equal(normalizarClique(ok, "Mozilla/5.0", new Set(["outro"]), AGORA), null);
  const lista = [
    { ts: AGORA.toISOString(), produto: "a", loja: "shopee" },
    { ts: AGORA.toISOString(), produto: "a", loja: "amazon" },
    { ts: AGORA.toISOString(), produto: "b", loja: "shopee" },
    { ts: "2026-01-01T00:00:00Z", produto: "c", loja: "shopee" },
  ];
  const a = agregar(lista, 30, AGORA);
  assert.equal(a.total, 3);
  assert.deepEqual(a.porProduto[0], ["a", 2]);
  assert.deepEqual(a.porLoja[0], ["shopee", 2]);
});

test("build: HTML indexável sem JS, só ofertas ativas, dados verdadeiros e sitemap correto", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-"));
  try {
    const r = build({ catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
    const ler = (rel) => readFileSync(join(saida, rel), "utf8");
    const produtos = readdirSync(join(saida, "produto"));
    assert.equal(produtos.length, 11, "produto sem oferta ativa não vira página");
    assert.ok(!produtos.includes("produto-exemplo-06-marca-ficticia"));

    const p2 = ler("produto/produto-exemplo-02-marca-ficticia/index.html");
    assert.match(p2, /<h1>Produto Exemplo 02<\/h1>/);
    assert.match(p2, /<link rel="canonical" href="https:\/\/exemplo\.invalid\/produto\/produto-exemplo-02-marca-ficticia\/">/);
    assert.match(p2, /Como Associado da Amazon/);
    assert.match(p2, /Menor preço consultado/);
    const links = [...p2.matchAll(/<a class="btn btn-(\w+)" href="([^"]+)"[^>]*rel="([^"]+)"/g)];
    assert.equal(links.length, 3);
    links.forEach(([, , , rel]) => assert.match(rel, /sponsored/));
    const amazonBloco = p2.split('oferta-amazon')[1].split("</li>")[0];
    assert.doesNotMatch(amazonBloco, /R\$/, "preço da Amazon não aparece");
    const ld = [...p2.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(ld.some((d) => d["@type"] === "BreadcrumbList"));
    const prod = ld.find((d) => d["@type"] === "Product");
    assert.ok(prod && prod.offers.every((o) => o.seller.name !== "Amazon"));
    assert.doesNotMatch(p2, /aggregateRating|"Review"|ratingValue/);

    const p3 = ler("produto/produto-exemplo-03-marca-ficticia/index.html");
    assert.doesNotMatch(p3, /amazon\.com\.br\/dp\/B0SEMTAG/, "link sem tag não é publicado");
    assert.match(p3, /Também em verificação: Amazon, Shopee/);

    const p1 = ler("produto/produto-exemplo-01-marca-ficticia/index.html");
    assert.match(p1, /versões ou tamanhos diferentes/);
    assert.doesNotMatch(p1, /Menor preço consultado/, "sem mesmo produto confirmado não compara");

    const sitemap = ler("sitemap.xml");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.equal(locs.length, r.indexaveis);
    assert.ok(!locs.some((l) => l.includes("produto-exemplo-12")), "página rasa fica fora do sitemap");
    assert.match(ler("produto/produto-exemplo-12-marca-ficticia/index.html"), /noindex, follow/);
    assert.ok(locs.some((l) => l.includes("produto-exemplo-03")), "3 características bastam para indexar");
    locs.forEach((l) => {
      const rel = l.replace("https://exemplo.invalid/", "");
      assert.ok(existsSync(join(saida, rel, "index.html")), `sitemap aponta para página existente: ${l}`);
      assert.match(readFileSync(join(saida, rel, "index.html"), "utf8"), /content="index, follow"/);
    });
    assert.match(ler("robots.txt"), /Sitemap: https:\/\/exemplo\.invalid\/sitemap\.xml/);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("build: modo exemplo nunca é indexável", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-ex-"));
  try {
    const r = build({ catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, exemplo: true, agora: AGORA });
    assert.equal(r.indexaveis, 0);
    assert.match(readFileSync(join(saida, "robots.txt"), "utf8"), /Disallow: \//);
    assert.match(readFileSync(join(saida, "index.html"), "utf8"), /noindex/);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("build: catálogo com erro não gera site", () => {
  assert.throws(() => build({ catalogoPath: "test/fixtures/catalogo-invalido.json", saida: join(tmpdir(), "nao-gera") }), /erro/);
});

test("servidor: recebe clique e redireciona URL sem barra final", async () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-srv-"));
  const arquivo = join(saida, "cliques.jsonl");
  build({ catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
  const srv = criarServidor({ dist: saida, arquivoCliques: arquivo, produtos: new Set(["produto-exemplo-02-marca-ficticia"]) });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const post = await fetch(`${base}/api/clique`, { method: "POST", headers: { "user-agent": "Mozilla/5.0" }, body: JSON.stringify({ produto: "produto-exemplo-02-marca-ficticia", loja: "shopee", pagina: "/" }) });
    assert.equal(post.status, 204);
    assert.equal(readFileSync(arquivo, "utf8").trim().split("\n").length, 1);
    const semBarra = await fetch(`${base}/produto/produto-exemplo-02-marca-ficticia`, { redirect: "manual" });
    assert.equal(semBarra.status, 301);
    assert.equal((await fetch(`${base}/nao-existe/`)).status, 404);
    assert.equal((await fetch(`${base}/../package.json`)).status, 404);
  } finally {
    srv.close();
    rmSync(saida, { recursive: true, force: true });
  }
});

test("build: subcaminho (GitHub Pages) prefixa links internos e mantém canonical absoluto", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-base-"));
  process.env.SITE_URL = "https://usuario.github.io/vitrine/";
  try {
    build({ catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
    const html = readFileSync(join(saida, "produto/produto-exemplo-02-marca-ficticia/index.html"), "utf8");
    assert.match(html, /href="\/vitrine\/assets\/style\.css"/);
    assert.match(html, /href="\/vitrine\/categoria\//);
    assert.doesNotMatch(html, /href="\/(?!vitrine\/|\/)/, "nenhum link interno sem o subcaminho");
    assert.match(html, /<link rel="canonical" href="https:\/\/usuario\.github\.io\/vitrine\/produto\//);
    assert.match(readFileSync(join(saida, "sitemap.xml"), "utf8"), /<loc>https:\/\/usuario\.github\.io\/vitrine\/produto\//);
  } finally {
    delete process.env.SITE_URL;
    rmSync(saida, { recursive: true, force: true });
  }
});
