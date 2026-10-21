import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validarLinkAfiliado, normalizarLoja } from "../src/lib/links.mjs";
import { estadoOferta, validarCatalogo, produtoIndexavel, avaliarPublicacao, somenteConfirmadas } from "../src/lib/catalogo.mjs";
import { normalizarPesquisa, mesclarCatalogo } from "../src/lib/importar.mjs";
import { normalizarClique, agregar } from "../src/lib/cliques.mjs";
import { build } from "../src/build.mjs";
import { avaliarGuias, similaridade, validarPerguntas } from "../src/lib/guias.mjs";
import { classificar, urlParaChecagem } from "../src/cli/checar-links.mjs";
import { canonicalizarCategoria } from "../src/lib/categorias.mjs";
import { criarServidor } from "../src/server.mjs";

// Os testes não podem herdar as variáveis do workflow de publicação.
for (const v of ["SITE_URL", "AMAZON_TAG", "ENDPOINT_CLIQUES", "SOMENTE_CONFIRMADOS"]) delete process.env[v];

const AGORA = new Date("2026-10-14T18:00:00-03:00");
const CONFIG = { siteUrl: "https://site.test", afiliados: { amazonTag: null }, precoValidadeHoras: 24 };
const V = { linkVerificado: true, verificadoEm: "2026-10-14" };
const CFG = "test/fixtures/config-teste.json";

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
    const r = build({ configPath: CFG, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
    const ler = (rel) => readFileSync(join(saida, rel), "utf8");
    const produtos = readdirSync(join(saida, "produto"));
    assert.equal(produtos.length, 29, "produto sem oferta ativa não vira página");
    assert.ok(!produtos.includes("produto-exemplo-06-marca-ficticia"));

    const p2 = ler("produto/produto-exemplo-02-marca-ficticia/index.html");
    assert.match(p2, /<h1>Produto Exemplo 02<\/h1>/);
    assert.match(p2, /<link rel="canonical" href="https:\/\/exemplo\.invalid\/produto\/produto-exemplo-02-marca-ficticia\/">/);
    assert.doesNotMatch(p2, /Como Associado da Amazon/, "sem participação confirmada, sem declaração da Amazon");
    assert.match(p2, /Links de afiliado: podemos receber comissão/);
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
    const r = build({ configPath: CFG, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, exemplo: true, agora: AGORA });
    assert.equal(r.indexaveis, 0);
    assert.match(readFileSync(join(saida, "robots.txt"), "utf8"), /Disallow: \//);
    assert.match(readFileSync(join(saida, "index.html"), "utf8"), /noindex/);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("build: catálogo com erro não gera site", () => {
  assert.throws(() => build({ configPath: CFG, catalogoPath: "test/fixtures/catalogo-invalido.json", saida: join(tmpdir(), "nao-gera") }), /erro/);
});

test("servidor: recebe clique e redireciona URL sem barra final", async () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-srv-"));
  const arquivo = join(saida, "cliques.jsonl");
  build({ configPath: CFG, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
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
    build({ configPath: CFG, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
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

test("versão institucional: catálogo vazio gera site legítimo, sem nada comercial", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-inst-"));
  process.env.SITE_URL = "https://usuario.github.io/vitrine";
  try {
    const r = build({ configPath: CFG, catalogoPath: "test/fixtures/catalogo-vazio.json", saida, agora: AGORA });
    assert.equal(r.produtosPublicados, 0);
    for (const pag of ["index.html", "sobre/index.html", "como-funciona/index.html", "busca/index.html", "aviso-de-afiliados/index.html", "contato/index.html", "privacidade/index.html", "404.html"]) {
      const html = readFileSync(join(saida, pag), "utf8");
      assert.doesNotMatch(html, /Associado da Amazon|participamos dos programas|além dos programas de afiliados/i, `${pag}: sem alegar participação não confirmada`);
      assert.doesNotMatch(html, /data-oferta|btn-amazon|btn-shopee|btn-mercadolivre/, `${pag}: sem botão de compra`);
      assert.doesNotMatch(html, /R\$\s?\d/, `${pag}: sem preço`);
      assert.doesNotMatch(html, /Produto Exemplo|Marca Fictícia|fictíci|Rode a importação/i, `${pag}: sem dado fictício nem texto interno`);
    }
    assert.ok(!existsSync(join(saida, "produto")), "sem produtos, nenhuma página de produto");
    // Categorias planejadas são navegáveis, mas honestas: em curadoria, noindex, sem oferta.
    for (const slug of ["eletronicos", "casa-e-cozinha", "pets"]) {
      const cat = readFileSync(join(saida, "categoria", slug, "index.html"), "utf8");
      assert.match(cat, /em curadoria/i);
      assert.match(cat, /noindex, follow/);
      assert.doesNotMatch(cat, /data-oferta|btn-amazon|btn-shopee|btn-mercadolivre|\d+ produtos? com link/);
    }
    const home = readFileSync(join(saida, "index.html"), "utf8");
    assert.match(home, /Como funciona/);
    assert.match(home, /Vitrine em curadoria/);
    assert.match(home, /Categorias populares/);
    assert.doesNotMatch(home, /<small>\d+ produtos?<\/small>/, "categoria vazia nunca mostra contagem de ofertas");
    assert.match(home, /Em curadoria/);
    assert.match(home, /Exemplo ilustrativo/);
    assert.match(home, /<meta property="og:image" content="https:\/\/usuario\.github\.io\/vitrine\/assets\/og-image\.png">/);
    assert.deepEqual(JSON.parse(readFileSync(join(saida, "busca.json"), "utf8")).produtos, []);
    assert.ok(existsSync(join(saida, "como-funciona/index.html")) && existsSync(join(saida, "busca/index.html")));
    for (const f of ["assets/og-image.png", "assets/icon-512.png", "assets/favicon.svg", "assets/fonts/plus-jakarta-sans-latin-800-normal.woff2"]) assert.ok(existsSync(join(saida, f)), f);
    const aviso = readFileSync(join(saida, "aviso-de-afiliados/index.html"), "utf8");
    assert.match(aviso, /Links de afiliado: podemos receber comissão/, "aviso geral mantido");
    assert.match(aviso, /está em análise/);
    assert.doesNotMatch(aviso, /participamos dos programas/i);
    assert.match(readFileSync(join(saida, "contato/index.html"), "utf8"), /href="https:\/\/exemplo\.invalid\/contato"/);
    const locs = [...readFileSync(join(saida, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(locs.sort(), ["https://usuario.github.io/vitrine/", "https://usuario.github.io/vitrine/aviso-de-afiliados/", "https://usuario.github.io/vitrine/como-funciona/", "https://usuario.github.io/vitrine/contato/", "https://usuario.github.io/vitrine/sobre/"]);
  } finally {
    delete process.env.SITE_URL;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("publicação: institucional liberado; comercial exige tag da Amazon; URL e contato obrigatórios", () => {
  const TODOS = { amazon: true, mercadolivre: true, shopee: true };
  const base = { siteUrl: "https://usuario.github.io/vitrine", contato: { url: "https://x.test" }, afiliados: { amazonTag: null, programasConfirmados: TODOS }, precoValidadeHoras: 24 };
  const vazio = { produtos: [] };
  assert.deepEqual(avaliarPublicacao(vazio, base, AGORA).pendencias, []);
  assert.equal(avaliarPublicacao(vazio, base, AGORA).modo, "institucional");
  assert.ok(avaliarPublicacao(vazio, { ...base, siteUrl: "https://exemplo.invalid" }, AGORA).pendencias.length);
  assert.ok(avaliarPublicacao(vazio, { ...base, contato: {} }, AGORA).pendencias.length);
  const comAmazon = { produtos: [{ id: "a", nome: "Produto A", categoria: "Casa", ofertas: [{ loja: "amazon", url: "https://amzn.to/x", ...V }] }] };
  const r = avaliarPublicacao(comAmazon, base, AGORA);
  assert.equal(r.modo, "comercial");
  assert.ok(r.pendencias.some((p) => /AMAZON_TAG/.test(p)));
  assert.deepEqual(avaliarPublicacao(comAmazon, { ...base, afiliados: { amazonTag: "abc-20", programasConfirmados: TODOS } }, AGORA).pendencias, []);
  const naoConfirmado = avaliarPublicacao(comAmazon, { ...base, afiliados: { amazonTag: "abc-20", programasConfirmados: { amazon: false } } }, AGORA);
  assert.ok(naoConfirmado.pendencias.some((p) => /não está confirmada/.test(p)), "oferta de programa não confirmado bloqueia");
  const soShopee = { produtos: [{ id: "b", nome: "Produto B", categoria: "Casa", ofertas: [{ loja: "shopee", url: "https://s.shopee.com.br/x", ...V }] }] };
  assert.deepEqual(avaliarPublicacao(soShopee, base, AGORA).pendencias, [], "sem Amazon, a tag não é exigida");
});

test("busca: índice só com produtos publicados e URLs com subcaminho", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-busca-"));
  process.env.SITE_URL = "https://usuario.github.io/vitrine";
  try {
    build({ configPath: CFG, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida, agora: AGORA });
    const { produtos } = JSON.parse(readFileSync(join(saida, "busca.json"), "utf8"));
    assert.equal(produtos.length, 29);
    assert.ok(produtos.every((p) => p.url.startsWith("/vitrine/produto/")));
    assert.ok(!produtos.some((p) => p.id.includes("exemplo-06")), "produto sem oferta ativa fica fora da busca");
    const cat = readFileSync(join(saida, "categoria/eletronicos/index.html"), "utf8");
    assert.match(cat, /data-filtros/);
    assert.match(cat, /<form class="busca" action="\/vitrine\/busca\/"/);
  } finally {
    delete process.env.SITE_URL;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("declaração da Amazon aparece só com participação confirmada", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-amz-"));
  const cfg = join(saida, "config.json");
  const base = JSON.parse(readFileSync(CFG, "utf8"));
  writeFileSync(cfg, JSON.stringify({ ...base, afiliados: { ...base.afiliados, programasConfirmados: { amazon: true, mercadolivre: true, shopee: false } } }));
  try {
    build({ configPath: cfg, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida: join(saida, "dist"), agora: AGORA });
    const ler = (f) => readFileSync(join(saida, "dist", f), "utf8");
    assert.match(ler("index.html"), /Como Associado da Amazon, ganhamos com compras qualificadas/);
    assert.match(ler("aviso-de-afiliados/index.html"), /Participamos dos programas de afiliados: Amazon e Mercado Livre\./);
    assert.match(ler("produto/produto-exemplo-02-marca-ficticia/index.html"), /Como Associado da Amazon/);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("CSS: .secao só define espaçamento vertical (não anula as margens do .container)", () => {
  const css = readFileSync("assets/style.css", "utf8");
  for (const m of css.matchAll(/\.secao\s*\{([^}]*)\}/g)) {
    assert.doesNotMatch(m[1], /(^|;)\s*padding\s*:/, `regra .secao com padding abreviado: ${m[0]}`);
  }
});

test("verificador de links: aceita página de produto da loja certa e recusa busca, login e outro domínio", () => {
  assert.equal(classificar("amazon", "https://www.amazon.com.br/Produto-X/dp/B0ABCDEFGH?tag=x-20", 200).ok, true);
  assert.equal(classificar("amazon", "https://www.amazon.com.br/s?k=fone", 200).ok, false);
  assert.equal(classificar("amazon", "https://www.amazon.com.br/ap/signin?x=1", 200).ok, false);
  assert.equal(classificar("amazon", "https://www.amazon.com.br/dp/B0ABCDEFGH", 404).ok, false);
  assert.equal(classificar("amazon", "https://www.amazon.com.br/dp/B0ABCDEFGH", 503).ok, null, "bloqueio anti-robô é inconclusivo, não falha");
  assert.equal(classificar("amazon", "https://www.amazon.com.br/errors/validateCaptcha?amzn=x", 200).ok, null, "captcha da Amazon é inconclusivo");
  assert.equal(classificar("amazon", "https://www.amazon.com.br/dp/B0ABCDEFGH?tag=x-20", 200, { corpo: "<form action=\"/errors/validateCaptcha\">" }).ok, null, "captcha com 200 na URL do produto também");
  assert.equal(classificar("amazon", "https://www.amazon.com.br/s?k=fone", 200, { corpo: "resultados" }).ok, false, "link que cai na busca continua falha");
  assert.equal(classificar("amazon", "https://golpe.com/errors/validateCaptcha", 200).ok, false, "captcha fora do domínio da Amazon não salva o link");
  assert.equal(classificar("mercadolivre", "https://www.mercadolivre.com.br/fone-x/p/MLB12345678", 200).ok, true);
  assert.equal(classificar("mercadolivre", "https://produto.mercadolivre.com.br/MLB-1234567-fone-_JM", 200).ok, true);
  assert.equal(classificar("mercadolivre", "https://lista.mercadolivre.com.br/fone", 200).ok, false);
  assert.equal(classificar("shopee", "https://shopee.com.br/Fone-X-i.123456.7891011", 200).ok, true);
  assert.equal(classificar("shopee", "https://shopee.com.br/search?keyword=fone", 200).ok, false);
  assert.equal(classificar("shopee", "https://shopee.com.br/opaanlp/419739190/23694205612?utm_source=an_1", 200).ok, true, "link curto de afiliado da Shopee");
  const social = "https://www.mercadolivre.com.br/social/ad123?matt_word=ad123&matt_tool=68963796&ref=XYZ";
  assert.equal(classificar("mercadolivre", social, 200, { corpo: '<a href="/p/MLB24326256">', identificador: "MLB24326256" }).ok, true, "social do ML com o produto na página");
  assert.equal(classificar("mercadolivre", social, 200, { corpo: "<div id=root></div>", identificador: "MLB24326256" }).ok, null, "produto não visível: inconclusivo");
  assert.equal(classificar("mercadolivre", social, 200, { corpo: "MLB243262567", identificador: "MLB24326256" }).ok, null, "não confunde com outro MLB");
  assert.equal(classificar("mercadolivre", "https://www.mercadolivre.com.br/social/ad123?ref=XYZ", 200).ok, false, "sem matt_tool é falha");
  assert.equal(classificar("shopee", "https://golpe.com/shopee.com.br/x-i.1.2", 200).ok, false);
  assert.equal(classificar("shopee", "https://shopee.com.br/x-i.1.2", 0).ok, false, "sem resposta é falha");
});

test("categorias: nomes de pesquisa caem na categoria canônica", () => {
  const C = ["Eletrônicos", "Casa e Cozinha", "Beleza e Cuidados", "Saúde e Bem-estar", "Esporte e Lazer", "Ferramentas", "Bebês e Infantil", "Pets", "Games", "Informática"];
  assert.equal(canonicalizarCategoria("Cozinha", C), "Casa e Cozinha");
  assert.equal(canonicalizarCategoria("fones e áudio", C), "Eletrônicos");
  assert.equal(canonicalizarCategoria("Notebook e escritório", C), "Informática");
  assert.equal(canonicalizarCategoria("Cachorros", C), "Pets");
  assert.equal(canonicalizarCategoria("eletrônicos", C), "Eletrônicos");
  assert.equal(canonicalizarCategoria("Papelaria criativa", C), "Papelaria criativa", "sem correspondência mantém o nome");
});

test("estrutura comercial com 30 produtos em 10 categorias", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-30-"));
  const cfg = join(saida, "config.json");
  const base = JSON.parse(readFileSync("config.json", "utf8"));
  writeFileSync(cfg, JSON.stringify({ ...base, siteUrl: "https://exemplo.invalid", afiliados: { ...base.afiliados, amazonTag: null, programasConfirmados: { amazon: true, mercadolivre: true, shopee: true } } }));
  try {
    const r = build({ configPath: cfg, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida: join(saida, "dist"), agora: AGORA });
    assert.equal(r.produtosPublicados, 29);
    assert.equal(r.categorias, 10);
    const ler = (f) => readFileSync(join(saida, "dist", f), "utf8");
    for (const slug of ["eletronicos", "casa-e-cozinha", "beleza-e-cuidados", "saude-e-bem-estar", "esporte-e-lazer", "ferramentas", "bebes-e-infantil", "pets", "games", "informatica"]) {
      const html = ler(`categoria/${slug}/index.html`);
      assert.match(html, /class="card"/, `${slug}: tem produtos`);
      assert.match(html, /content="index, follow"/, `${slug}: indexável`);
    }
    const home = ler("index.html");
    assert.equal((home.match(/<article class="card"/g) || []).length, 9, "home mostra os prioritários com link válido (o 06 não tem nenhum)");
    assert.doesNotMatch(home, /Em curadoria/, "com todas as categorias abastecidas, nada em curadoria");
    const p = ler("produto/produto-exemplo-20-marca-ficticia/index.html");
    assert.equal((p.match(/data-oferta/g) || []).length, 3, "3 botões de loja");
    assert.match(p, /Ver na Amazon/); assert.match(p, /Ver no Mercado Livre/); assert.match(p, /Ver na Shopee/);
    assert.match(p, /Como Associado da Amazon/, "programa confirmado: declaração exibida");
    const locs = (ler("sitemap.xml").match(/<loc>/g) || []).length;
    assert.ok(locs >= 5 + 10 + 28, `sitemap com institucionais + categorias + produtos indexáveis (${locs})`);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("catálogo real do Cowork: ofertas preservadas, preço só dentro da validade e sem alegar programa", () => {
  const catalogo = JSON.parse(readFileSync("data/catalogo.json", "utf8"));
  if (!catalogo.produtos.length) return;
  const entrada = JSON.parse(readFileSync("entrada/status_produtos.json", "utf8"));
  for (const st of entrada.prontos) {
    const p = catalogo.produtos.find((x) => x.nome === st.nome);
    assert.ok(p, `importado: ${st.nome}`);
    assert.equal(p.ofertas[0].url, st.link_afiliado, "link de afiliado preservado byte a byte");
  }
  const config = JSON.parse(readFileSync("config.json", "utf8"));
  assert.deepEqual(validarCatalogo(catalogo, config).erros, []);
  const conf = config.afiliados.programasConfirmados;
  assert.deepEqual(conf, { amazon: true, mercadolivre: false, shopee: false }, "só a Amazon tem evidência documentada (docs/autorizacao-programas.md)");
  assert.equal(config.afiliados.amazonTag, "vitrineachados-20");
  assert.ok(catalogo.produtos.flatMap((p) => p.ofertas).filter((o) => o.loja === "amazon").every((o) => /[?&]tag=vitrineachados-20(&|$)/.test(o.url) && o.preco == null), "Amazon: tag própria e nunca preço");
  const saida = mkdtempSync(join(tmpdir(), "vitrine-real-"));
  try {
    const dentro = new Date("2026-10-20T16:00:00-03:00");
    const r = build({ catalogoPath: "data/catalogo.json", saida, agora: dentro });
    assert.equal(r.produtosPublicados, catalogo.produtos.length);
    const busca = JSON.parse(readFileSync(join(saida, "busca.json"), "utf8")).produtos;
    assert.equal(busca.length, catalogo.produtos.length);
    const html = readdirSync(join(saida, "produto")).map((d) => readFileSync(join(saida, "produto", d, "index.html"), "utf8")).join("\n");
    for (const st of entrada.prontos) assert.ok(html.includes(`href="${st.link_afiliado.replaceAll("&", "&amp;")}"`), `botão aponta para ${st.link_afiliado}`);
    assert.doesNotMatch(html, /aggregateRating|desconto/i);
    const paginas = readdirSync(join(saida, "produto")).map((d) => readFileSync(join(saida, "produto", d, "index.html"), "utf8"));
    for (const pag of paginas) {
      const temAmazon = /btn-amazon/.test(pag);
      assert.equal(/Como Associado da Amazon, ganhamos com compras qualificadas/.test(pag.split("<footer")[0]), temAmazon, "declaração da Amazon junto aos botões da Amazon (e só neles)");
    }
    const samsung = readFileSync(join(saida, "produto", catalogo.produtos.find((p) => /Galaxy A17/.test(p.nome)).id, "index.html"), "utf8");
    assert.doesNotMatch(samsung.split("<main")[1].split("Relacionados")[0], /R\$\s?1\.?349/, "preço não confirmado não aparece");
    rmSync(saida, { recursive: true, force: true });
    build({ catalogoPath: "data/catalogo.json", saida, agora: new Date("2026-10-22T12:00:00-03:00") });
    const vencido = JSON.parse(readFileSync(join(saida, "busca.json"), "utf8")).produtos;
    assert.ok(vencido.every((p) => p.preco == null), "preço com mais de 24h some sozinho");
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("home cita só as lojas com oferta ativa", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-lojas-"));
  const cat = join(saida, "c.json");
  writeFileSync(cat, JSON.stringify({ versao: 1, produtos: [{ id: "x", nome: "Produto X", categoria: "Pets", ofertas: [{ loja: "shopee", url: "https://s.shopee.com.br/abc", ...V }] }] }));
  try {
    build({ configPath: CFG, catalogoPath: cat, saida: join(saida, "d"), agora: AGORA });
    const hero = readFileSync(join(saida, "d", "index.html"), "utf8").split('class="hero-lojas"')[1].split("</div>")[0];
    assert.match(hero, /Shopee/);
    assert.doesNotMatch(hero, /Amazon|Mercado Livre/);
  } finally {
    rmSync(saida, { recursive: true, force: true });
  }
});

test("publicação só com lojas confirmadas (SOMENTE_CONFIRMADOS=1)", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-conf-"));
  const cfg = join(saida, "config.json");
  const base = JSON.parse(readFileSync(CFG, "utf8"));
  writeFileSync(cfg, JSON.stringify({ ...base, afiliados: { ...base.afiliados, programasConfirmados: { amazon: false, mercadolivre: false, shopee: true } } }));
  process.env.SOMENTE_CONFIRMADOS = "1";
  try {
    const r = build({ configPath: cfg, catalogoPath: "data/exemplo/catalogo-exemplo.json", saida: join(saida, "dist"), agora: AGORA });
    const html = readdirSync(join(saida, "dist", "produto")).map((d) => readFileSync(join(saida, "dist", "produto", d, "index.html"), "utf8")).join("\n");
    assert.ok(r.produtosPublicados > 0);
    assert.match(html, /btn-shopee/);
    assert.doesNotMatch(html, /btn-amazon|btn-mercadolivre|amazon\.com\.br\/dp|mercadolivre\.com/, "loja não confirmada não aparece na publicação");
    const catalogo = JSON.parse(readFileSync("data/exemplo/catalogo-exemplo.json", "utf8"));
    const recorte = somenteConfirmadas(catalogo, JSON.parse(readFileSync(cfg, "utf8")));
    assert.equal(avaliarPublicacao(recorte, { ...JSON.parse(readFileSync(cfg, "utf8")), siteUrl: "https://a.b" }, AGORA).pendencias.filter((p) => /não está confirmada/.test(p)).length, 0);
  } finally {
    delete process.env.SOMENTE_CONFIRMADOS;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("meta descrição (produto, categoria, home, busca) cita só as lojas publicadas", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-meta-"));
  const cfg = join(saida, "config.json");
  const base = JSON.parse(readFileSync("config.json", "utf8"));
  writeFileSync(cfg, JSON.stringify({ ...base, siteUrl: "https://exemplo.invalid" }));
  process.env.SOMENTE_CONFIRMADOS = "1";
  try {
    const r = build({ configPath: cfg, catalogoPath: "data/catalogo.json", saida: join(saida, "dist"), agora: new Date("2026-10-20T16:00:00-03:00") });
    const conf = Object.entries(base.afiliados.programasConfirmados).filter(([, v]) => v).map(([l]) => l);
    const esperado = JSON.parse(readFileSync("data/catalogo.json", "utf8")).produtos.filter((p) => p.ofertas.some((o) => conf.includes(o.loja))).length;
    assert.equal(r.produtosPublicados, esperado);
    const dist = join(saida, "dist");
    const paginas = [join(dist, "index.html"), join(dist, "busca", "index.html"), ...readdirSync(join(dist, "produto")).map((d) => join(dist, "produto", d, "index.html")), ...readdirSync(join(dist, "categoria")).map((d) => join(dist, "categoria", d, "index.html"))];
    for (const f of paginas) {
      const html = readFileSync(f, "utf8");
      const meta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
      assert.ok(meta.replace(/&(#\d+|\w+);/g, "x").length <= 160, `meta curta: ${meta}`);
      if (!conf.includes("shopee")) assert.doesNotMatch(meta, /Shopee/, f);
      if (!conf.includes("mercadolivre")) assert.doesNotMatch(meta, /Mercado Livre/, f);
      assert.doesNotMatch(html, /s\.shopee\.com\.br|meli\.la/, "loja não confirmada fora do HTML publicado");
    }
  } finally {
    delete process.env.SOMENTE_CONFIRMADOS;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("vitrine publicada: guias só com produtos publicados, sem categorias vazias, arquivos estáticos e texto de loja única", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-guias-"));
  const cfg = join(saida, "config.json");
  const base = JSON.parse(readFileSync("config.json", "utf8"));
  writeFileSync(cfg, JSON.stringify({ ...base, siteUrl: "https://exemplo.invalid" }));
  process.env.SOMENTE_CONFIRMADOS = "1";
  try {
    const r = build({ configPath: cfg, catalogoPath: "data/catalogo.json", saida: join(saida, "dist"), agora: new Date("2026-10-20T16:00:00-03:00") });
    const dist = join(saida, "dist");
    const guias = JSON.parse(readFileSync("data/guias.json", "utf8")).guias;
    const publicados = new Set(readdirSync(join(dist, "produto")));
    const esperados = guias.filter((g) => g.status === "aprovado" && g.produtos.every((id) => publicados.has(id)));
    assert.equal(r.guias, esperados.length, JSON.stringify(r.guiasRejeitados));
    esperados.forEach((g) => assert.ok(existsSync(join(dist, "guias", g.slug, "index.html")), g.slug));
    // Nenhuma categoria publicada sem produto.
    for (const d of readdirSync(join(dist, "categoria"))) {
      assert.match(readFileSync(join(dist, "categoria", d, "index.html"), "utf8"), /\/produto\//, `categoria vazia: ${d}`);
    }
    for (const f of readdirSync("static")) assert.ok(existsSync(join(dist, f)), `estático ${f}`);
    const conf = Object.entries(base.afiliados.programasConfirmados).filter(([, v]) => v);
    const home = readFileSync(join(dist, "index.html"), "utf8");
    if (conf.length === 1) {
      assert.doesNotMatch(home, /Compare lojas|veja em quais lojas/);
    }
  } finally {
    delete process.env.SOMENTE_CONFIRMADOS;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("importação de imagem: só https e só autorizada com marcação explícita", () => {
  const { produtos } = normalizarPesquisa({ produtos: [
    { nome: "Produto A", imagem: "https://x.example/a.webp", imagemPermitida: true, imagemFonte: "programa" },
    { nome: "Produto B", imagem: "https://x.example/b.webp" },
    { nome: "Produto C", imagem: "http://x.example/c.webp", imagemPermitida: true },
  ] });
  assert.equal(produtos[0].imagemPermitida, true);
  assert.equal(produtos[0].imagemFonte, "programa");
  assert.equal(produtos[1].imagemPermitida, false);
  assert.equal(produtos[2].imagem, undefined);
});

test("ficha sem foto: tipo e destaques curtos são validados e renderizados", () => {
  const cfg = { afiliados: { amazonTag: "x-20" }, precoValidadeHoras: 24 };
  const base = { id: "p-x", nome: "Produto X", categoria: "Casa", ofertas: [] };
  assert.equal(validarCatalogo({ produtos: [{ ...base, tipo: "Mouse sem fio", destaques: ["Receptor USB", "Pilha inclusa"] }] }, cfg).erros.length, 0);
  assert.ok(validarCatalogo({ produtos: [{ ...base, destaques: ["a", "b", "c", "d"] }] }, cfg).erros.some((e) => /destaques/.test(e)));
  assert.ok(validarCatalogo({ produtos: [{ ...base, destaques: ["um texto longo demais para caber na ficha"] }] }, cfg).erros.some((e) => /destaques/.test(e)));
  const { produtos } = normalizarPesquisa({ produtos: [{ nome: "Produto Y", tipo: "Sabão líquido", destaques: ["5 litros", "Sem fosfato"] }] });
  assert.equal(produtos[0].tipo, "Sabão líquido");
  assert.deepEqual(produtos[0].destaques, ["5 litros", "Sem fosfato"]);
});

test("portão de qualidade: barra rascunho, texto curto, alegações proibidas e repetição", () => {
  const base = {
    slug: "guia-x", status: "aprovado", titulo: "Guia X", resumo: "r".repeat(100), introducao: "Introdução do guia com contexto suficiente para o leitor entender a escolha. ".repeat(4),
    secoes: [{ titulo: "A", paragrafos: ["palavra ".repeat(200)] }, { titulo: "B", paragrafos: ["outra coisa ".repeat(100)] }],
    produtos: ["p1"], atualizadoEm: "2026-10-20", fonteFatos: "Anúncios oficiais",
  };
  const ctx = { publicados: new Set(["p1"]), agora: new Date("2026-10-20") };
  assert.equal(avaliarGuias([base], ctx).aprovados.length, 1);
  assert.match(avaliarGuias([{ ...base, status: "rascunho" }], ctx).rejeitados[0].motivos.join(), /status/);
  assert.match(avaliarGuias([{ ...base, secoes: base.secoes.slice(0, 1) }], ctx).rejeitados[0].motivos.join(), /seções/);
  assert.match(avaliarGuias([{ ...base, introducao: base.introducao + " Nós testamos por um mês." }], ctx).rejeitados[0].motivos.join(), /teste pessoal/);
  assert.match(avaliarGuias([{ ...base, produtos: ["p2"] }], ctx).rejeitados[0].motivos.join(), /não publicados/);
  const dup = avaliarGuias([base, { ...base, slug: "guia-y" }], ctx);
  assert.equal(dup.aprovados.length, 1);
  assert.match(dup.rejeitados[0].motivos.join(), /repetitivo|duplicado/);
  assert.ok(similaridade("a b c d e f g h", "a b c d e f g h") > 0.9);
  assert.ok(validarPerguntas([{ pergunta: "Tem desconto hoje?", resposta: "Sim, menor preço garantido na loja." }], "p").length > 0);
});

test("feed Atom e IndexNow: feed válido no build e chave publicada", () => {
  const saida = mkdtempSync(join(tmpdir(), "vitrine-feed-"));
  const cfg = join(saida, "config.json");
  writeFileSync(cfg, JSON.stringify({ ...JSON.parse(readFileSync("config.json", "utf8")), siteUrl: "https://exemplo.invalid" }));
  process.env.SOMENTE_CONFIRMADOS = "1";
  try {
    const r = build({ configPath: cfg, saida: join(saida, "dist"), agora: new Date("2026-10-20T16:00:00-03:00") });
    const feed = readFileSync(join(saida, "dist", "feed.xml"), "utf8");
    assert.match(feed, /^<\?xml/);
    assert.match(feed, /<feed xmlns="http:\/\/www.w3.org\/2005\/Atom"/);
    const sitemap = readFileSync(join(saida, "dist", "sitemap.xml"), "utf8");
    const produtosIdx = (sitemap.match(/\/produto\//g) || []).length;
    assert.equal((feed.match(/<entry>/g) || []).length, r.guias + produtosIdx);
    assert.match(readFileSync(join(saida, "dist", "index.html"), "utf8"), /application\/atom\+xml/);
    assert.ok(readdirSync("static").some((f) => /^[a-f0-9]{32}\.txt$/.test(f)));
  } finally {
    delete process.env.SOMENTE_CONFIRMADOS;
    rmSync(saida, { recursive: true, force: true });
  }
});

test("checagem de links não gera clique de afiliado na Amazon", () => {
  const u = urlParaChecagem("amazon", "https://www.amazon.com.br/dp/B09B8VGCR8?&linkCode=ll2&tag=vitrineachados-20&linkId=abc&ref_=as_li_ss_tl");
  assert.equal(u, "https://www.amazon.com.br/dp/B09B8VGCR8");
  assert.doesNotMatch(u, /tag=|linkId|linkCode/);
  assert.equal(urlParaChecagem("shopee", "https://s.shopee.com.br/x"), "https://s.shopee.com.br/x");
});
