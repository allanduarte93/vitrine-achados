// Confere o site PUBLICADO num navegador real (desktop e celular): fotos carregadas, botões de loja,
// divulgação de publicidade e páginas principais. Não clica em links de afiliado (nenhum clique artificial).
//   SITE_URL=https://usuario.github.io/repo node scripts/conferir-publico.mjs <pasta-saida>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

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
    cards: document.querySelectorAll("article.card, article.rec").length,
    destaquesSemFoto: document.querySelectorAll(".grade-destaque .sem-foto").length,
    fotos: [...document.querySelectorAll(".card-img img")].map((i) => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })),
    faixa: !!document.querySelector(".faixa-pub"),
    largura: document.documentElement.scrollWidth,
  }));
  // As fotos são lazy: rola a página para carregar todas antes de conferir.
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await pg.waitForLoadState("networkidle");
  home.fotos = await pg.evaluate(() => [...document.querySelectorAll(".card-img img")].map((i) => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0 })));
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${SAIDA}/home-${nome}-primeira-tela.png` });
  await pg.screenshot({ path: `${SAIDA}/home-${nome}-inteira.png`, fullPage: true });
  rel.paginas.push({ pagina: "/", viewport: nome, ...home, fotos: home.fotos.length, fotosOk: home.fotos.filter((f) => f.ok).length });
  // A home mostra uma seleção (desde 04/11); todos os produtos ficam na busca e nas categorias.
  if (home.cards < 1 || home.cards > produtos.length) falhas.push(`${nome}: home com ${home.cards} produtos, índice com ${produtos.length}`);
  if (home.destaquesSemFoto) falhas.push(`${nome}: ${home.destaquesSemFoto} destaque(s) sem foto na vitrine principal`);
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
  const semFoto = produtos.find((p) => !p.imagem);
  if (semFoto) { await pg.goto(`${BASE}${semFoto.url.replace(idx.base, "")}`, { waitUntil: "networkidle" }); await pg.screenshot({ path: `${SAIDA}/produto-sem-foto-${nome}.png`, fullPage: true }); }
  await pg.goto(`${BASE}/categoria/beleza-e-cuidados/`, { waitUntil: "networkidle" });
  await pg.screenshot({ path: `${SAIDA}/categoria-${nome}.png`, fullPage: true });
  // Jornada do comprador: chega, busca, filtra, abre a ficha e encontra o botão da loja (sem clicar no link de afiliado).
  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await pg.fill("#q", "hidratante");
  await Promise.all([pg.waitForNavigation({ waitUntil: "networkidle" }), pg.press("#q", "Enter")]);
  await pg.waitForSelector("[data-resultados] .card, [data-resultados] .rec", { timeout: 15000 }).catch(() => {});
  const achados = await pg.$$eval("[data-resultados] .card, [data-resultados] .rec", (c) => c.map((x) => x.querySelector("h3 a")?.getAttribute("href")));
  if (achados.length < 2) falhas.push(`${nome}: jornada — busca "hidratante" achou ${achados.length}`);
  await pg.screenshot({ path: `${SAIDA}/jornada-busca-${nome}.png` });
  if (achados[0]) {
    await pg.click("[data-resultados] h3 a");
    await pg.waitForLoadState("networkidle");
    const ficha = await pg.evaluate(() => ({ h1: !!document.querySelector("h1"), botao: !!document.querySelector("#ofertas a[data-oferta]"), onde: /Você conclui a compra no site/.test(document.body.innerText) }));
    if (!ficha.h1 || !ficha.botao || !ficha.onde) falhas.push(`${nome}: jornada — ficha sem título, botão de loja ou explicação da compra`);
    await pg.screenshot({ path: `${SAIDA}/jornada-ficha-${nome}.png` });
  }
  // Links internos da home: nenhum quebrado.
  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const internos = await pg.$$eval("a[href]", (as) => [...new Set(as.map((a) => a.href).filter((h) => h.startsWith(location.origin) && !h.includes("#")))]);
  for (const u of internos) { const st = (await fetch(u)).status; if (st !== 200) falhas.push(`${nome}: link interno ${u} → HTTP ${st}`); }
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, document.body.scrollHeight); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${SAIDA}/rodape-${nome}.png` });
  // Produtos marcados como indisponíveis no catálogo: fora de todas as páginas e do índice.
  if (nome === "desktop") {
    const cat = JSON.parse(readFileSync("data/catalogo.json", "utf8"));
    const fora = cat.produtos.filter((p) => p.ofertas.every((o) => ["indisponivel", "sem-compra-direta"].includes(o.disponibilidade?.estado)));
    for (const p of fora) {
      if (produtos.some((x) => x.id === p.id)) falhas.push(`${p.id}: indisponível, mas está no índice da busca`);
      const st = (await fetch(`${BASE}/produto/${p.id}/`)).status;
      if (st !== 404) falhas.push(`${p.id}: indisponível, mas /produto/ responde HTTP ${st}`);
    }
    const paginasChave = ["/", "/categoria/casa-e-cozinha/", "/categoria/pets/", "/guias/bravecto-comprimido-o-que-diz-o-fabricante/", "/guias/cozinha-organizada-potes-temperos-balanca/"];
    for (const u of paginasChave) {
      const html = await (await fetch(`${BASE}${u}`)).text();
      for (const p of fora) for (const o of p.ofertas) if (html.includes(o.url.replaceAll("&", "&amp;")) || html.includes(`/produto/${p.id}/`)) falhas.push(`${u}: ainda cita o indisponível ${p.id}`);
    }
    const guiaBravecto = await (await fetch(`${BASE}/guias/bravecto-comprimido-o-que-diz-o-fabricante/`)).text();
    if (!guiaBravecto.includes("https://meli.la/153k3Ma")) falhas.push("guia do Bravecto: sem a oferta ativa do Mercado Livre");
    rel.indisponiveis = fora.map((p) => p.id);
  }
  // Celular: o primeiro botão de compra aparece na primeira tela em fichas e guias.
  if (nome === "celular") {
    const guiasPub = [...(await (await fetch(`${BASE}/guias/`)).text()).matchAll(/href="[^"]*\/guias\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
    const alvosBotao = [...produtos.map((p) => p.url.replace(idx.base, "")), ...[...new Set(guiasPub)].map((g) => `/guias/${g}/`)];
    const ys = [];
    for (const u of alvosBotao) {
      await pg.goto(`${BASE}${u}`, { waitUntil: "domcontentloaded" });
      const y = await pg.evaluate(() => { const a = document.querySelector("main a[data-oferta]:not([data-barra])"); return a ? Math.round(a.getBoundingClientRect().top + scrollY) : null; });
      ys.push(y);
      if (y !== null && y > vp.height - 48) falhas.push(`celular ${u}: botão de compra fora da 1ª tela (y=${y})`);
    }
    const v = ys.filter((y) => y !== null);
    rel.botaoCelular = { paginas: alvosBotao.length, comBotao: v.length, yMin: Math.min(...v), yMax: Math.max(...v) };
  }
  const comFoto = produtos.find((p) => p.imagem);
  if (comFoto) { await pg.goto(`${BASE}${comFoto.url.replace(idx.base, "")}`, { waitUntil: "networkidle" }); await pg.screenshot({ path: `${SAIDA}/produto-com-foto-${nome}.png`, fullPage: false }); }
  await pg.goto(`${BASE}/busca/?q=creatina`, { waitUntil: "networkidle" });
  const busca = await pg.evaluate(() => document.querySelectorAll("[data-resultados] .card").length);
  if (!busca) falhas.push(`${nome}: busca "creatina" sem resultado`);
  if (await pg.$('option[value="preco"]')) falhas.push(`${nome}: ordenação por preço ainda publicada na busca`);
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
