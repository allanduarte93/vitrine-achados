// Confere o site PUBLICADO num navegador real (desktop e celular): fotos carregadas, botões de loja,
// divulgação de publicidade e páginas principais. Não clica em links de afiliado (nenhum clique artificial).
//   SITE_URL=https://usuario.github.io/repo node scripts/conferir-publico.mjs <pasta-saida>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = (process.env.SITE_URL || "").replace(/\/+$/, "");
const SAIDA = process.argv[2] || "conferencia";
mkdirSync(SAIDA, { recursive: true });
const LOJA = { amazon: /^https:\/\/(www\.)?amazon\.com\.br\/|^https:\/\/amzn\.to\//, mercadolivre: /^https:\/\/(meli\.la|mercadolivre\.com|www\.mercadolivre\.com\.br)\// };
const falhas = [];
const rel = { data: new Date().toISOString(), site: BASE, paginas: [] };

const b = await chromium.launch();
const idx = await (await fetch(`${BASE}/busca.json`)).json();
const produtos = idx.produtos;
for (const [nome, vp] of [["desktop", { width: 1366, height: 900 }], ["celular", { width: 390, height: 844 }]]) {
  const pg = await b.newPage({ viewport: vp });
  const erros = [];
  pg.on("pageerror", (e) => erros.push(e.message));
  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const home = await pg.evaluate(() => ({
    cards: document.querySelectorAll("article.card").length,
    fotos: [...document.querySelectorAll(".card-img img")].map((i) => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })),
    faixa: !!document.querySelector(".faixa-pub"),
    largura: document.documentElement.scrollWidth,
  }));
  // As fotos são lazy: rola a página para carregar todas antes de conferir.
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await pg.waitForLoadState("networkidle");
  home.fotos = await pg.evaluate(() => [...document.querySelectorAll(".card-img img")].map((i) => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })));
  await pg.evaluate(() => scrollTo(0, 0));
  await pg.screenshot({ path: `${SAIDA}/home-${nome}.png`, fullPage: nome === "desktop" });
  rel.paginas.push({ pagina: "/", viewport: nome, ...home, fotos: home.fotos.length, fotosOk: home.fotos.filter((f) => f.ok).length });
  if (home.cards !== produtos.length) falhas.push(`${nome}: home com ${home.cards} cards, índice com ${produtos.length}`);
  if (!home.faixa) falhas.push(`${nome}: sem faixa de publicidade`);
  if (home.largura > vp.width) falhas.push(`${nome}: rolagem horizontal (${home.largura}px)`);
  home.fotos.filter((f) => !f.ok).forEach((f) => falhas.push(`${nome}: foto não carregou na home: ${f.src}`));

  for (const p of produtos) {
    await pg.goto(`${BASE}${p.url.replace(idx.base, "")}`, { waitUntil: "networkidle" });
    const r = await pg.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent.trim(),
      foto: (() => { const i = document.querySelector(".produto-img img"); return i ? { src: i.currentSrc, ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth } : null; })(),
      botoes: [...document.querySelectorAll("#ofertas a[data-oferta]")].map((a) => ({ href: a.href, rel: a.rel, loja: a.dataset.loja, texto: a.textContent.trim() })),
      aviso: /Links de afiliado: podemos receber comissão/.test(document.body.innerText),
      amazonDecl: /Como Associado da Amazon, ganhamos com compras qualificadas/.test(document.body.innerText),
      faixa: !!document.querySelector(".faixa-pub"),
    }));
    if (r.h1 !== p.nome) falhas.push(`${p.id}: título diferente do índice`);
    if (p.imagem && !(r.foto && r.foto.ok && r.foto.src === p.imagem)) falhas.push(`${p.id}: foto autorizada não carregou (${r.foto?.src || "ausente"})`);
    if (!p.imagem && r.foto) falhas.push(`${p.id}: foto exibida sem autorização no índice`);
    if (r.botoes.length !== p.ofertas.length) falhas.push(`${p.id}: ${r.botoes.length} botões para ${p.ofertas.length} ofertas`);
    r.botoes.forEach((x, i) => {
      if (x.href !== p.ofertas[i]?.url) falhas.push(`${p.id}: botão com link diferente do catálogo`);
      if (!/sponsored/.test(x.rel)) falhas.push(`${p.id}: botão sem rel=sponsored`);
      if (!LOJA[x.loja]?.test(x.href)) falhas.push(`${p.id}: botão não aponta para a loja ${x.loja}`);
    });
    if (!r.aviso || !r.faixa) falhas.push(`${p.id}: divulgação de afiliado ausente`);
    if (r.botoes.some((x) => x.loja === "amazon") && !r.amazonDecl) falhas.push(`${p.id}: sem declaração da Amazon`);
    if (nome === "desktop") rel.paginas.push({ pagina: p.id, foto: r.foto, botoes: r.botoes.map((x) => x.loja) });
  }
  const comFoto = produtos.find((p) => p.imagem);
  if (comFoto) { await pg.goto(`${BASE}${comFoto.url.replace(idx.base, "")}`, { waitUntil: "networkidle" }); await pg.screenshot({ path: `${SAIDA}/produto-com-foto-${nome}.png`, fullPage: false }); }
  await pg.goto(`${BASE}/busca/?q=creatina`, { waitUntil: "networkidle" });
  const busca = await pg.evaluate(() => document.querySelectorAll("[data-resultados] .card").length);
  if (!busca) falhas.push(`${nome}: busca "creatina" sem resultado`);
  await pg.screenshot({ path: `${SAIDA}/busca-${nome}.png`, fullPage: false });
  if (erros.length) falhas.push(`${nome}: erros de JavaScript: ${erros.join("; ")}`);
  await pg.close();
}
await b.close();
rel.falhas = falhas;
rel.resumo = { produtos: produtos.length, comFotoNoIndice: produtos.filter((p) => p.imagem).length };
writeFileSync(`${SAIDA}/relatorio.json`, JSON.stringify(rel, null, 2));
console.log(JSON.stringify(rel.paginas.filter((x) => x.pagina === "/"), null, 1));
console.log(`\nProdutos: ${produtos.length} · com foto autorizada: ${rel.resumo.comFotoNoIndice}`);
console.log(falhas.length ? `FALHAS (${falhas.length}):\n- ${falhas.join("\n- ")}` : "Conferência do site público: tudo OK.");
process.exit(falhas.length ? 1 : 0);
