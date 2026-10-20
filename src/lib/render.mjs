/**
 * Templates HTML (strings). Tudo renderizado no build: as páginas funcionam e são
 * indexáveis sem JavaScript. O JS só faz busca, filtros e registro de cliques.
 */
import { LOJAS } from "./links.mjs";
import { slugify } from "./catalogo.mjs";
import { icone, iconeCategoria, TONS, marcaSvg, heroSvg, comparaSvg } from "./icones.mjs";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export const AVISO_CURTO = "Links de afiliado: podemos receber comissão por compras feitas por eles, sem custo extra para você.";
export const AVISO_AMAZON = "Como Associado da Amazon, ganhamos com compras qualificadas.";
/** Programas de afiliados cuja participação DESTE site foi confirmada (config.afiliados.programasConfirmados). */
export const programasConfirmados = (config) =>
  Object.entries(config.afiliados?.programasConfirmados || {}).filter(([, ok]) => ok === true).map(([loja]) => loja);
const listaLojas = (lojas) => {
  const nomes = lojas.map((l) => LOJAS[l]?.nome || l);
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
};
/** Declaração da Amazon: só quando a participação do site no Associados estiver confirmada. */
const declaracaoAmazon = (config) => (programasConfirmados(config).includes("amazon") ? AVISO_AMAZON : "");
const fraseProgramas = (config) => {
  const lojas = programasConfirmados(config);
  return lojas.length
    ? `Participamos dos programas de afiliados: ${listaLojas(lojas)}.`
    : "A participação deste site nos programas de afiliados das lojas está em análise. Enquanto não houver aprovação, não publicamos links de afiliado dessas lojas.";
};
const NAO_SOMOS_LOJA = "A Vitrine Achados indica produtos de outras lojas. Não vendemos, não processamos pagamentos e não fazemos entregas: a compra é feita direto no site da loja.";

const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const bolhaCategoria = (nome, tamanho = 28) => {
  const ic = iconeCategoria(nome);
  const [fundo, traco] = TONS[ic] || TONS.outros;
  return `<span class="bolha" style="background:${fundo};color:${traco}">${icone(ic, { tamanho })}</span>`;
};

const marcaLoja = (loja) => `<span class="marca-loja ${loja}"><i></i>${esc(LOJAS[loja].nome)}</span>`;

// Sem foto autorizada: painel original com ícone da categoria e a marca — não imita foto do produto.
const semFoto = (p, tamanho) => {
  const ic = iconeCategoria(p.categoria);
  const [fundo, traco] = TONS[ic] || TONS.outros;
  return `<div class="sem-foto" style="--fundo:${fundo};--traco:${traco}">
  <span class="sem-foto-ic">${icone(ic, { tamanho })}</span>
  ${p.marca ? `<strong class="sem-foto-marca">${esc(p.marca)}</strong>` : ""}
  <span class="sem-foto-nota">${icone("externo", { tamanho: 14 })}Fotos oficiais na loja</span>
</div>`;
};

const imagemProduto = (p, tamanho = 64) =>
  p.imagem && p.imagemPermitida === true
    ? `<img src="${esc(p.imagem)}" alt="${esc(p.nome)}" width="600" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
    : semFoto(p, tamanho);

/* ---------------- Layout ---------------- */

export const layout = ({ config, titulo, descricao, caminho, conteudo, jsonld = [], indexavel = true, exemplo = false, categorias = [], temGuias = false }) => {
  const url = `${config.siteUrl}${caminho}`;
  const robots = indexavel && !exemplo ? "index, follow" : "noindex, follow";
  const og = `${config.siteUrl}/assets/og-image.png`;
  const navCategorias = categorias.length
    ? `<nav class="cab-cats" aria-label="Categorias"><div class="container trilho">${categorias
        .map((c) => `<a class="chip-cat" href="/categoria/${c.slug}/">${icone(iconeCategoria(c.nome), { tamanho: 18 })}${esc(c.nome)}</a>`)
        .join("")}</div></nav>`
    : `<div class="cab-cats"><div class="container faixa-confianca">
        <span>${icone("check", { tamanho: 16 })}Links conferidos antes de publicar</span>
        <span>${icone("check", { tamanho: 16 })}Compra feita no site da loja</span>
        <span>${icone("check", { tamanho: 16 })}Sem custo extra para você</span>
      </div></div>`;
  return `<!doctype html>
<html lang="${esc(config.idioma || "pt-BR")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.nomeSite)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14215a">
${config.verificacao?.google ? `<meta name="google-site-verification" content="${esc(config.verificacao.google)}">` : ""}
${config.verificacao?.bing ? `<meta name="msvalidate.01" content="${esc(config.verificacao.bing)}">` : ""}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/assets/site.webmanifest">
<link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css">
${jsonld.map(jsonLd).join("\n")}
</head>
<body data-endpoint="${esc(config.endpointCliques || "")}">
${exemplo ? `<div class="faixa-exemplo">PRÉ-VISUALIZAÇÃO COM DADOS FICTÍCIOS — não publicar</div>` : ""}
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="cab">
  <div class="container cab-topo">
    <a class="logo" href="/" aria-label="${esc(config.nomeSite)}: página inicial">${marcaSvg(40)}<span class="logo-txt"><b>vitrine</b><span>achados</span></span></a>
    <form class="busca" action="/busca/" method="get" role="search">
      <label class="sr" for="q">Buscar produtos</label>
      <input id="q" name="q" type="search" placeholder="Busque por produto, marca ou categoria" autocomplete="off" enterkeyhint="search">
      <button type="submit" aria-label="Buscar">${icone("busca", { tamanho: 20 })}</button>
    </form>
    <nav class="cab-links" aria-label="Atalhos">
      <a href="/como-funciona/">${icone("info", { tamanho: 18 })}<span>Como funciona</span></a>
    </nav>
  </div>
  ${navCategorias}
</header>
<main id="conteudo">
${conteudo}
</main>
<footer class="rodape">
  <div class="container">
    <div class="rodape-grade">
      <div>
        <a class="logo" href="/">${marcaSvg(36)}<span class="logo-txt"><b>vitrine</b><span>achados</span></span></a>
        <p>${esc(NAO_SOMOS_LOJA)}</p>
      </div>
      <div>
        <h3>Navegue</h3>
        <ul>
          <li><a href="/">Início</a></li>
          <li><a href="/busca/">Buscar produtos</a></li>
          <li><a href="/como-funciona/">Como funciona</a></li>
          ${temGuias ? `<li><a href="/guias/">Guias de compra</a></li>` : ""}
          ${categorias.slice(0, 4).map((c) => `<li><a href="/categoria/${c.slug}/">${esc(c.nome)}</a></li>`).join("")}
        </ul>
      </div>
      <div>
        <h3>Institucional</h3>
        <ul>
          <li><a href="/sobre/">Sobre nós</a></li>
          <li><a href="/aviso-de-afiliados/">Aviso de afiliados</a></li>
          <li><a href="/contato/">Contato</a></li>
          <li><a href="/privacidade/">Privacidade</a></li>
        </ul>
      </div>
      <div>
        <h3>Transparência</h3>
        <p>${esc(AVISO_CURTO)} ${esc(declaracaoAmazon(config))} Preços e disponibilidade são definidos pelas lojas e podem mudar a qualquer momento.</p>
      </div>
    </div>
    <div class="rodape-base">
      <span>© ${new Date().getFullYear()} ${esc(config.nomeSite)}. Amazon, Mercado Livre e Shopee são marcas de seus respectivos donos; não temos vínculo oficial com essas lojas${programasConfirmados(config).length ? " além dos programas de afiliados" : ""}.</span>
    </div>
  </div>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>
`;
};

/* ---------------- Componentes ---------------- */

const menorPrecoExibido = (ativas) => {
  const com = ativas.filter((o) => o.estado.mostrarPreco);
  if (!com.length) return null;
  return com.reduce((a, b) => (b.preco < a.preco ? b : a));
};

export const cardProduto = (p, ativas) => {
  const menor = menorPrecoExibido(ativas);
  return `<article class="card" data-produto="${esc(p.id)}" data-lojas="${ativas.map((o) => o.loja).join(" ")}" data-preco="${menor ? menor.preco : ""}" data-nome="${esc(p.nome.toLowerCase())}">
  <div class="card-img">${imagemProduto(p)}${ativas.length > 1 ? `<span class="selo-lojas">${icone("comparar", { tamanho: 14 })}${ativas.length} lojas</span>` : ""}</div>
  <div class="card-corpo">
    <span class="card-cat">${esc(p.categoria)}</span>
    <h3><a href="/produto/${p.id}/">${esc(p.nome)}</a></h3>
    ${p.marca ? `<span class="card-marca">${esc(p.marca)}</span>` : ""}
    ${menor ? `<span class="card-preco">a partir de<strong>${brl(menor.preco)}</strong>no ${esc(LOJAS[menor.loja].nome)} · consultado em ${esc(dataHora(menor.precoColetadoEm))}</span>` : ""}
    <div class="card-lojas">${ativas.map((o) => marcaLoja(o.loja)).join("")}</div>
    <a class="btn btn-prim" href="/produto/${p.id}/">${ativas.length > 1 ? "Comparar ofertas" : "Ver oferta"}</a>
  </div>
</article>`;
};

const COMPROMISSOS = [
  "Só publicamos ofertas com link de afiliado conferido antes de entrar no site.",
  "Não exibimos avaliações, notas, números de vendas ou descontos: esses dados ficam na loja.",
  "Preço só aparece quando foi consultado recentemente, sempre com data. Na Amazon, o preço é sempre conferido na própria loja.",
  "A comparação entre lojas só é feita quando confirmamos que é o mesmo produto.",
];

const blocoComoFunciona = () => `<ol class="passos">
  <li class="passo"><span class="bolha">${icone("lupaCheck", { tamanho: 26 })}</span><h3>Selecionamos e conferimos</h3><p>Escolhemos produtos procurados e checamos o link, o anúncio e a loja antes de publicar.</p></li>
  <li class="passo"><span class="bolha">${icone("comparar", { tamanho: 26 })}</span><h3>Você confere</h3><p>Leia o resumo e os pontos principais tirados do anúncio oficial e, quando o mesmo item está em mais de uma loja, compare onde comprar.</p></li>
  <li class="passo"><span class="bolha">${icone("loja", { tamanho: 26 })}</span><h3>Compra na loja</h3><p>O botão leva direto à página do produto na loja. Preço final, pagamento e entrega são conferidos e feitos com a loja.</p></li>
</ol>`;

const cabPagina = ({ titulo, sub, icn = "info", tom = ["#ffe7dc", "#c2410c"] }) => `<section class="cab-pagina"><div class="container cab-pagina-in">
  <span class="bolha" style="background:${tom[0]};color:${tom[1]}">${icone(icn, { tamanho: 30 })}</span>
  <div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ""}</div>
</div></section>`;

/* ---------------- Páginas ---------------- */

export const paginaInicial = ({ config, destaques, categorias, todos, guias = [] }) => {
  const temProdutos = destaques.length + todos.length > 0;
  const umaLoja = new Set([...destaques, ...todos].flatMap((x) => x.ativas.map((o) => o.loja))).size === 1;
  const vitrine = destaques.length ? destaques : todos.slice(0, 12);
  const comOferta = categorias.filter((c) => c.total > 0);

  const secaoVitrine = temProdutos
    ? `<section class="secao" aria-labelledby="t-destaques"><div class="container">
  <div class="secao-cab"><div><p class="sobretitulo">Vitrine</p><h2 id="t-destaques">Achados em destaque</h2><p>${umaLoja ? "Produtos com link conferido e informações tiradas do anúncio oficial." : "Produtos com link conferido. Toque para ver as lojas disponíveis."}</p></div><a class="btn btn-sec" href="/busca/">Ver todos ${icone("seta", { tamanho: 18 })}</a></div>
  <div class="grade-prod">${vitrine.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
</div></section>`
    : `<section class="secao" aria-labelledby="t-curadoria"><div class="container">
  <div class="secao-cab"><div><p class="sobretitulo">Vitrine</p><h2 id="t-curadoria">Vitrine em curadoria</h2><p>Os primeiros achados entram aqui assim que cada link for conferido. Preferimos uma vitrine menor e verdadeira a uma cheia de ofertas sem checagem.</p></div></div>
  <div class="curadoria">
    <div class="curadoria-txt">
      <h3>O que cada produto precisa ter para aparecer</h3>
      <p>Nenhum produto entra na vitrine sem passar por estes critérios:</p>
      <ul class="criterios">
        <li>${icone("check", { tamanho: 16 })}Link de afiliado oficial, aberto e conferido</li>
        <li>${icone("check", { tamanho: 16 })}Anúncio e loja de destino identificados</li>
        <li>${icone("check", { tamanho: 16 })}Mesmo produto confirmado antes de comparar lojas</li>
        <li>${icone("check", { tamanho: 16 })}Informações tiradas do anúncio, sem notas inventadas</li>
      </ul>
    </div>
    <div class="curadoria-arte" aria-hidden="true"><div class="pilha">
      <div class="pilha-item">${bolhaCategoria("Eletrônicos", 22)}<div><b>Link conferido</b><small>loja de destino identificada</small></div><span class="ok">${icone("check", { tamanho: 20 })}</span></div>
      <div class="pilha-item">${bolhaCategoria("Casa e Cozinha", 22)}<div><b>Mesmo produto</b><small>modelo e versão confirmados</small></div><span class="ok">${icone("check", { tamanho: 20 })}</span></div>
      <div class="pilha-item">${bolhaCategoria("Beleza e Cuidados", 22)}<div><b>Dados do anúncio</b><small>sem avaliações inventadas</small></div><span class="ok">${icone("check", { tamanho: 20 })}</span></div>
    </div></div>
  </div>
</div></section>`;

  // Categorias com produtos primeiro; as vazias aparecem como "Em curadoria" (nunca com contagem de ofertas).
  const tiles = [...comOferta, ...categorias.filter((c) => c.total === 0)].map((c) =>
    `<a class="cat" href="/categoria/${c.slug}/">${bolhaCategoria(c.nome, 30)}<strong>${esc(c.nome)}</strong>${
      c.total > 0 ? `<small>${c.total} ${c.total === 1 ? "produto" : "produtos"}</small>` : `<span class="tag-curadoria">Em curadoria</span>`
    }</a>`);

  // Só cita as lojas com oferta ativa na vitrine; sem produtos, as três em que trabalhamos.
  const ativasHome = new Set([...destaques, ...todos].flatMap((x) => x.ativas.map((o) => o.loja)));
  const lojasHero = ["amazon", "mercadolivre", "shopee"].filter((l) => !ativasHome.size || ativasHome.has(l));
  const nomesHero = lojasHero.map((l) => ({ amazon: "da Amazon", mercadolivre: "do Mercado Livre", shopee: "da Shopee" })[l]);
  const listaHero = nomesHero.length > 1 ? `${nomesHero.slice(0, -1).join(", ")} e ${nomesHero.at(-1)}` : nomesHero[0];

  // Comparação entre lojas só faz sentido com mais de uma loja publicada (ou na versão institucional, como explicação).
  const secaoCompara = ativasHome.size === 1 ? "" : `<section class="secao" aria-labelledby="t-compara"><div class="container compara">
  <div>
    <p class="sobretitulo">Comparação</p>
    <h2 id="t-compara">Mesmo produto, lojas diferentes</h2>
    <p>Quando um produto está em mais de uma loja, mostramos todas lado a lado, com a loja de destino sempre identificada.</p>
    <ul class="compara-lista">
      <li>${icone("check", { tamanho: 20 })}<span>Só comparamos quando confirmamos que é exatamente o mesmo item.</span></li>
      <li>${icone("check", { tamanho: 20 })}<span>Preços do Mercado Livre e da Shopee aparecem com a data da consulta.</span></li>
      <li>${icone("check", { tamanho: 20 })}<span>Na Amazon, o preço é sempre conferido na própria loja.</span></li>
    </ul>
  </div>
  <figure class="cartao-compara" style="margin:0">
    <div class="cartao-compara-topo">${comparaSvg()}<div style="flex:1;display:grid;gap:8px"><span class="linha-skel" style="width:80%"></span><span class="linha-skel" style="width:50%"></span></div></div>
    ${["amazon", "mercadolivre", "shopee"].map((l) => `<div class="linha-loja"><div style="display:grid;gap:6px">${marcaLoja(l)}<span class="linha-skel" style="width:110px"></span></div><span class="botao-ilustra loja-${l}" aria-hidden="true">botão da loja</span></div>`).join("")}
    <figcaption class="rotulo-ilustrativo">Exemplo ilustrativo de como a comparação aparece</figcaption>
  </figure>
</div></section>`;
  const secaoGuias = guias.length
    ? `<section class="secao" aria-labelledby="t-guias"><div class="container">
  <div class="secao-cab"><div><p class="sobretitulo">Guias</p><h2 id="t-guias">Antes de comprar</h2><p>Comparativos feitos com as informações dos anúncios, para ajudar na escolha.</p></div><a class="btn btn-sec" href="/guias/">Todos os guias ${icone("seta", { tamanho: 18 })}</a></div>
  <div class="grade-guias">${guias.map(cardGuia).join("")}</div>
</div></section>`
    : "";

  const conteudo = `
<section class="hero"><div class="container hero-grade">
  <div>
    <span class="selo-topo">${icone("etiqueta", { tamanho: 18 })}Portal de descoberta de produtos</span>
    <h1>Os achados mais procurados, <em>em um só lugar</em>.</h1>
    <p class="hero-sub">Encontre produtos populares ${listaHero}${umaLoja ? ", leia o essencial de cada um" : ", veja em quais lojas estão disponíveis"} e vá direto para a oferta. A gente indica; você compra na loja.</p>
    <div class="hero-acoes">
      <a class="btn btn-prim" href="${temProdutos ? "#t-destaques" : "#t-categorias"}">${temProdutos ? "Ver achados" : "Ver categorias"} ${icone("seta", { tamanho: 18 })}</a>
      <a class="btn btn-sec" href="/como-funciona/">Como funciona</a>
    </div>
    <div class="hero-lojas"><span>Indicamos ofertas de</span>${lojasHero.map(marcaLoja).join("")}</div>
  </div>
  <div>${heroSvg()}</div>
</div></section>

<div class="container"><div class="beneficios">
  <div class="beneficio"><span class="bolha">${icone("escudo", { tamanho: 24 })}</span><div><strong>Links conferidos</strong><span>Só publicamos ofertas com link verificado.</span></div></div>
  <div class="beneficio"><span class="bolha">${icone(umaLoja ? "lupaCheck" : "comparar", { tamanho: 24 })}</span><div>${umaLoja ? "<strong>Informação do anúncio</strong><span>Resumo e pontos principais tirados do anúncio oficial.</span>" : "<strong>Compare lojas</strong><span>Veja onde o mesmo produto está disponível.</span>"}</div></div>
  <div class="beneficio"><span class="bolha">${icone("loja", { tamanho: 24 })}</span><div><strong>Compra na loja</strong><span>Pagamento e entrega direto com a loja.</span></div></div>
  <div class="beneficio"><span class="bolha">${icone("cofre", { tamanho: 24 })}</span><div><strong>Sem custo extra</strong><span>Você paga o mesmo preço da loja.</span></div></div>
</div></div>

${secaoVitrine}

${secaoGuias}

<section class="secao" aria-labelledby="t-categorias"><div class="container">
  <div class="secao-cab"><div><p class="sobretitulo">Explore</p><h2 id="t-categorias">Categorias populares</h2><p>${!comOferta.length ? "As categorias que estamos preparando. Os produtos entram em cada uma assim que o link for conferido." : comOferta.length < categorias.length ? "Navegue pelas categorias. As marcadas como “Em curadoria” ainda não têm produtos com link conferido." : "Navegue pelas categorias com produtos conferidos."}</p></div></div>
  <div class="grade-cats">${tiles.join("")}</div>
</div></section>

${secaoCompara}

<section class="secao" aria-labelledby="t-como"><div class="container">
  <div class="secao-cab"><div><p class="sobretitulo">Simples assim</p><h2 id="t-como">Como funciona</h2></div><a class="btn btn-sec" href="/como-funciona/">Saiba mais ${icone("seta", { tamanho: 18 })}</a></div>
  ${blocoComoFunciona()}
</div></section>

<section class="secao"><div class="container"><div class="faixa-transparencia">
  <span class="bolha">${icone("escudo", { tamanho: 28 })}</span>
  <div><h2>Transparência em primeiro lugar</h2><p>${esc(NAO_SOMOS_LOJA)} Quando você compra por um link do site, podemos receber uma comissão da loja, sem custo extra para você.</p></div>
  <a class="btn btn-sec" href="/aviso-de-afiliados/">Aviso de afiliados</a>
</div></div></section>`;

  return {
    titulo: `${config.nomeSite}: os achados mais procurados ${listaHero}`,
    descricao: `Produtos populares ${listaHero} em um só lugar, com links conferidos${lojasHero.length > 1 ? " e comparação entre lojas quando é o mesmo produto" : ""}.`,
    conteudo,
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebSite", name: config.nomeSite, url: `${config.siteUrl}/`, inLanguage: "pt-BR",
        potentialAction: { "@type": "SearchAction", target: `${config.siteUrl}/busca/?q={search_term_string}`, "query-input": "required name=search_term_string" } },
      { "@context": "https://schema.org", "@type": "Organization", name: config.nomeSite, url: `${config.siteUrl}/`, logo: `${config.siteUrl}/assets/icon-512.png` },
    ],
  };
};

const barraFiltros = (itens) => {
  const lojas = [...new Set(itens.flatMap(({ ativas }) => ativas.map((o) => o.loja)))];
  return `<form class="barra-filtros" data-filtros hidden>
  <strong>${icone("filtro", { tamanho: 18 })} Filtrar</strong>
  ${lojas.map((l) => `<label><input type="checkbox" name="loja" value="${l}" checked> ${esc(LOJAS[l].nome)}</label>`).join("")}
  <label>Ordenar <select name="ordem"><option value="nome">Nome (A-Z)</option><option value="preco">Menor preço consultado</option></select></label>
  <span class="contagem" data-contagem>${itens.length} ${itens.length === 1 ? "produto" : "produtos"}</span>
</form>`;
};

export const paginaCategoria = ({ config, categoria, itens, outras = [] }) => {
  const ic = iconeCategoria(categoria.nome);
  if (!itens.length) {
    const vizinhas = outras.filter((o) => o.total > 0).slice(0, 6);
    return {
      titulo: `${categoria.nome}: em curadoria | ${config.nomeSite}`,
      descricao: `A categoria ${categoria.nome.toLowerCase()} da ${config.nomeSite} está em curadoria: ainda não há produtos com link conferido.`,
      conteudo: `
${cabPagina({ titulo: esc(categoria.nome), sub: "Categoria em curadoria: ainda não há produtos com link conferido aqui.", icn: ic, tom: TONS[ic] })}
<div class="container">
  <nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <span>${esc(categoria.nome)}</span></nav>
  <div class="curadoria" style="margin-top:8px">
    <div class="curadoria-txt">
      <h2 style="font-size:24px">Estamos conferindo os produtos desta categoria</h2>
      <p>Só publicamos um produto depois de conferir o link, o anúncio e a loja. Por isso esta página ainda não tem ofertas.</p>
      <ul class="criterios">
        <li>${icone("check", { tamanho: 16 })}Link de afiliado oficial, aberto e conferido</li>
        <li>${icone("check", { tamanho: 16 })}Loja de destino identificada</li>
        <li>${icone("check", { tamanho: 16 })}Informações tiradas do anúncio, sem notas inventadas</li>
      </ul>
      <p style="margin-top:18px"><a class="btn btn-sec" href="/busca/">${icone("busca", { tamanho: 18 })} Buscar produtos</a></p>
    </div>
    <div class="curadoria-arte" aria-hidden="true"><span class="bolha" style="width:140px;height:140px;border-radius:40px;display:grid;place-items:center;background:${(TONS[ic] || TONS.outros)[0]};color:${(TONS[ic] || TONS.outros)[1]}">${icone(ic, { tamanho: 64 })}</span></div>
  </div>
  ${vizinhas.length ? `<section class="secao" aria-labelledby="t-outras"><div class="secao-cab"><h2 id="t-outras">Categorias com produtos</h2></div><div class="grade-cats">${vizinhas
    .map((o) => `<a class="cat" href="/categoria/${o.slug}/">${bolhaCategoria(o.nome, 30)}<strong>${esc(o.nome)}</strong><small>${o.total} ${o.total === 1 ? "produto" : "produtos"}</small></a>`)
    .join("")}</div></section>` : ""}
</div>`,
      jsonld: [],
    };
  }
  const conteudo = `
${cabPagina({ titulo: esc(categoria.nome), sub: `${itens.length} ${itens.length === 1 ? "produto" : "produtos"} com link conferido em ${esc(categoria.nome.toLowerCase())}. Compare as lojas disponíveis e vá direto para a oferta.`, icn: ic, tom: TONS[ic] })}
<div class="container">
  <nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <span>${esc(categoria.nome)}</span></nav>
  ${barraFiltros(itens)}
  <div class="grade-prod" data-grade>${itens.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
  <p class="aviso-botoes">${esc(AVISO_CURTO)}</p>
</div>`;
  return {
    titulo: `${categoria.nome}: produtos com links conferidos | ${config.nomeSite}`,
    descricao: `Produtos de ${categoria.nome.toLowerCase()} com links conferidos. ${(() => { const l = [...new Set(itens.flatMap(({ ativas }) => ativas.map((o) => o.loja)))]; return `${l.length > 1 ? "Lojas" : "Loja"}: ${listaLojas(l)}.`; })()}`,
    conteudo,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${config.siteUrl}/` },
          { "@type": "ListItem", position: 2, name: categoria.nome, item: `${config.siteUrl}/categoria/${categoria.slug}/` },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: itens.map(({ p }, i) => ({ "@type": "ListItem", position: i + 1, url: `${config.siteUrl}/produto/${p.id}/`, name: p.nome })),
      },
    ],
  };
};

export const paginaProduto = ({ config, p, ativas, inativas, relacionados }) => {
  const catSlug = slugify(p.categoria);
  const comparaveis = p.mesmoProdutoConfirmado === true ? ativas.filter((o) => o.estado.mostrarPreco) : [];
  const menor = comparaveis.length >= 2 ? Math.min(...comparaveis.map((o) => o.preco)) : null;
  const linhas = ativas
    .map((o) => {
      const loja = LOJAS[o.loja];
      const preco = o.estado.mostrarPreco
        ? `<strong>${brl(o.preco)}</strong><small>consultado em ${esc(dataHora(o.precoColetadoEm))} — pode mudar</small>`
        : `<span class="sem-preco">Confira o preço na loja</span>`;
      const destaque = menor !== null && o.preco === menor ? `<span class="tag-menor">Menor preço consultado</span>` : "";
      return `<li class="oferta oferta-${o.loja}">
  <div class="oferta-loja">${marcaLoja(o.loja)} ${destaque}</div>
  <div class="oferta-preco">${preco}</div>
  <a class="btn btn-${o.loja}" href="${esc(o.url)}" target="_blank" rel="sponsored nofollow noopener" data-oferta data-produto="${esc(p.id)}" data-loja="${o.loja}">${esc(loja.rotuloBotao)} ${icone("externo", { tamanho: 18 })}</a>
</li>`;
    })
    .join("\n");
  const emVerificacao = inativas.length
    ? `<p class="em-verificacao">Também em verificação: ${inativas.map((o) => esc(LOJAS[o.loja]?.nome || o.loja)).join(", ")}.</p>`
    : "";
  const aviso = ativas.length > 1 && p.mesmoProdutoConfirmado !== true
    ? `<p class="nota">As ofertas podem ser de versões ou tamanhos diferentes. Confira o modelo na página da loja antes de comprar.</p>`
    : "";
  const tabela = comparaveis.length >= 2
    ? `<section aria-labelledby="t-tab"><h2 id="t-tab">Comparação entre lojas</h2><table class="tabela-compara"><thead><tr><th>Loja</th><th>Preço consultado</th><th>Data da consulta</th></tr></thead><tbody>${comparaveis
        .sort((a, b) => a.preco - b.preco)
        .map((o) => `<tr><td>${esc(LOJAS[o.loja].nome)}</td><td>${brl(o.preco)}</td><td>${esc(dataHora(o.precoColetadoEm))}</td></tr>`)
        .join("")}</tbody></table><p class="nota">Preços consultados nas lojas; podem mudar a qualquer momento.</p></section>`
    : "";
  const pontos = (p.pontosChave || []).filter(Boolean);
  const descricao = (p.descricao || "").trim();
  const lojasPub = [...new Set(ativas.map((o) => o.loja))];
  const rotuloLojas = `${lojasPub.length > 1 ? "Lojas" : "Loja"}: ${listaLojas(lojasPub)}`;
  const sufixo = `: onde comprar, com link conferido. ${rotuloLojas}.`;
  const cabe = 155 - sufixo.length;
  const metaDesc = descricao ? descricao.slice(0, 155) : `${p.nome.length > cabe ? `${p.nome.slice(0, cabe - 1).trimEnd()}…` : p.nome}${sufixo}`;

  const conteudo = `
<div class="container">
  <nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <a href="/categoria/${catSlug}/">${esc(p.categoria)}</a> › <span>${esc(p.nome)}</span></nav>
  <article class="produto-grade">
    <div class="produto-img">${imagemProduto(p, 80)}</div>
    <div class="produto-info">
      <span class="card-cat">${esc(p.categoria)}</span>
      <h1>${esc(p.nome)}</h1>
      <p class="produto-meta">${p.marca ? `<span>Marca: <strong>${esc(p.marca)}</strong></span>` : ""}<span class="ok">${icone("escudo", { tamanho: 16 })}${ativas.length} ${ativas.length === 1 ? "loja com link conferido" : "lojas com link conferido"}</span></p>
      <section class="ofertas" aria-labelledby="t-onde">
        <h2 id="t-onde" class="sr">Onde comprar</h2>
        <ul class="lista-ofertas">${linhas}</ul>
        ${aviso}
        ${emVerificacao}
        <ul class="garantias">
          <li>${icone("externo", { tamanho: 18 })}<span>O botão abre a página do produto no site oficial da loja.</span></li>
          <li>${icone("cadeado", { tamanho: 18 })}<span>Pagamento, entrega e trocas são feitos com a loja.</span></li>
          <li>${icone("cofre", { tamanho: 18 })}<span>${esc(AVISO_CURTO)} ${ativas.some((o) => o.loja === "amazon") ? esc(declaracaoAmazon(config)) : ""}</span></li>
        </ul>
      </section>
    </div>
  </article>
  <div class="texto">
    ${descricao ? `<section aria-labelledby="t-sobre"><h2 id="t-sobre">Sobre o produto</h2><p>${esc(descricao)}</p></section>` : ""}
    ${pontos.length ? `<section aria-labelledby="t-pontos"><h2 id="t-pontos">Destaques do anúncio</h2><ul class="pontos">${pontos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
    ${tabela}
    <p class="fonte">Informações conferidas a partir dos anúncios das lojas${p.fonte ? ` (${esc(p.fonte)})` : ""}. Confirme detalhes, preço e frete na loja antes de comprar.</p>
  </div>
  ${relacionados.length ? `<section class="secao" aria-labelledby="t-rel"><div class="secao-cab"><h2 id="t-rel">Mais em ${esc(p.categoria)}</h2></div><div class="grade-prod">${relacionados.map(({ p: r, ativas: a }) => cardProduto(r, a)).join("")}</div></section>` : ""}
</div>`;

  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${config.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: p.categoria, item: `${config.siteUrl}/categoria/${catSlug}/` },
        { "@type": "ListItem", position: 3, name: p.nome, item: `${config.siteUrl}/produto/${p.id}/` },
      ],
    },
  ];
  // Product só com ofertas de preço exibido (dados verdadeiros e visíveis na página).
  const comPreco = ativas.filter((o) => o.estado.mostrarPreco);
  if (comPreco.length) {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nome,
      ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
      ...(p.imagem && p.imagemPermitida === true ? { image: p.imagem.startsWith("http") ? p.imagem : `${config.siteUrl}${p.imagem}` } : {}),
      category: p.categoria,
      offers: comPreco.map((o) => ({
        "@type": "Offer",
        price: o.preco.toFixed(2),
        priceCurrency: "BRL",
        url: o.url,
        seller: { "@type": "Organization", name: LOJAS[o.loja].nome },
      })),
    });
  }
  return { titulo: `${p.nome}: onde comprar | ${config.nomeSite}`, descricao: metaDesc, conteudo, jsonld };
};

/* ---------------- Guias editoriais ---------------- */

const cardGuia = (g) => `<a class="card-guia" href="/guias/${esc(g.slug)}/">
  <span class="card-guia-ic">${icone(iconeCategoria(g.categoria || ""), { tamanho: 26 })}</span>
  <strong>${esc(g.titulo)}</strong>
  <span>${esc(g.resumo)}</span>
  <span class="card-guia-ler">Ler o guia ${icone("seta", { tamanho: 16 })}</span>
</a>`;

export const paginaGuias = ({ config, guias }) => ({
  titulo: `Guias de compra | ${config.nomeSite}`,
  descricao: `Guias e comparativos da ${config.nomeSite} feitos com as informações dos anúncios oficiais, para ajudar a escolher antes de comprar.`,
  conteudo: `${cabPagina({ titulo: "Guias de compra", sub: "Comparativos feitos com as informações dos anúncios oficiais. Sem notas inventadas, sem avaliações de terceiros.", icn: "lupaCheck", tom: ["#e8edff", "#2546b8"] })}
<div class="container secao"><div class="grade-guias">${guias.map(cardGuia).join("")}</div></div>`,
});

export const paginaGuia = ({ config, guia, itens }) => {
  const secoes = (guia.secoes || [])
    .map((sec) => `<section><h2>${esc(sec.titulo)}</h2>${(sec.paragrafos || []).map((t) => `<p>${esc(t)}</p>`).join("")}${
      sec.lista?.length ? `<ul class="pontos">${sec.lista.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</section>`)
    .join("\n");
  const tabela = guia.tabela?.colunas?.length
    ? `<section><h2>${esc(guia.tabela.titulo || "Lado a lado")}</h2><div class="tabela-rolagem"><table class="tabela-compara"><thead><tr>${guia.tabela.colunas
        .map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${guia.tabela.linhas
        .map((l) => `<tr>${l.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div></section>`
    : "";
  const url = `${config.siteUrl}/guias/${guia.slug}/`;
  return {
    titulo: `${guia.titulo} | ${config.nomeSite}`,
    descricao: guia.resumo,
    conteudo: `
<div class="container">
  <nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <a href="/guias/">Guias</a> › <span>${esc(guia.titulo)}</span></nav>
  <article class="guia">
    <header class="guia-cab">
      <p class="sobretitulo">Guia de compra</p>
      <h1>${esc(guia.titulo)}</h1>
      <p class="guia-intro">${esc(guia.introducao)}</p>
      <p class="guia-meta">Atualizado em ${esc(guia.atualizadoEm)} · Informações conferidas nos anúncios oficiais</p>
    </header>
    <div class="texto guia-texto">
      ${secoes}
      ${tabela}
    </div>
    <section class="secao" aria-labelledby="t-guia-prod"><div class="secao-cab"><h2 id="t-guia-prod">Produtos citados neste guia</h2></div>
      <div class="grade-prod">${itens.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
    </section>
    <p class="fonte">${esc(guia.nota || "Este guia resume o que os fabricantes e as lojas informam nos anúncios. Confirme detalhes, preço e disponibilidade na página da loja antes de comprar.")}</p>
  </article>
</div>`,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guia.titulo,
        description: guia.resumo,
        datePublished: guia.publicadoEm || guia.atualizadoEm,
        dateModified: guia.atualizadoEm,
        inLanguage: "pt-BR",
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: config.nomeSite, url: `${config.siteUrl}/` },
        publisher: { "@type": "Organization", name: config.nomeSite, logo: { "@type": "ImageObject", url: `${config.siteUrl}/assets/icon-512.png` } },
        image: `${config.siteUrl}/assets/og-image.png`,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${config.siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Guias", item: `${config.siteUrl}/guias/` },
          { "@type": "ListItem", position: 3, name: guia.titulo, item: url },
        ],
      },
    ],
  };
};

export const paginaBusca = ({ config, lojas = ["amazon", "mercadolivre", "shopee"] }) => ({
  titulo: `Buscar produtos | ${config.nomeSite}`,
  descricao: `Busque produtos com links conferidos. ${lojas.length > 1 ? "Lojas" : "Loja"}: ${listaLojas(lojas)}.`,
  conteudo: `${cabPagina({ titulo: "Buscar produtos", sub: "Procure por nome, marca ou categoria entre os produtos com link conferido.", icn: "busca", tom: ["#e8edff", "#2546b8"] })}
<div class="container" style="padding-top:24px">
  <form class="busca-pagina" action="/busca/" method="get" role="search" data-busca>
    <label class="sr" for="q2">Buscar</label>
    <input id="q2" name="q" type="search" placeholder="Ex.: fone bluetooth, air fryer, garrafa térmica" autocomplete="off">
    <button class="btn btn-prim" type="submit">${icone("busca", { tamanho: 18 })} Buscar</button>
  </form>
  <div data-resultados aria-live="polite"><noscript><p class="vazio">A busca precisa de JavaScript. Você também pode navegar pelas categorias na página inicial.</p></noscript></div>
</div>`,
});

export const paginaComoFunciona = ({ config }) => ({
  titulo: `Como funciona | ${config.nomeSite}`,
  descricao: `Como a ${config.nomeSite} seleciona produtos, confere links e compara lojas, e como o site se mantém.`,
  conteudo: `${cabPagina({ titulo: "Como funciona", sub: "Do achado à loja em três passos, com transparência sobre como o site se mantém.", icn: "lupaCheck" })}
<div class="container secao" style="padding-top:32px">
  ${blocoComoFunciona()}
  <div class="texto">
    <h2>Nossos critérios</h2>
    <ul>${COMPROMISSOS.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    <h2>Quem vende o produto?</h2>
    <p>${esc(NAO_SOMOS_LOJA)}</p>
    <h2>Como o site se mantém</h2>
    <p>${esc(fraseProgramas(config))} ${esc(AVISO_CURTO)} Veja o <a href="/aviso-de-afiliados/">aviso de afiliados</a>.</p>
  </div>
</div>`,
});

export const paginaSobre = ({ config }) => ({
  titulo: `Sobre | ${config.nomeSite}`,
  descricao: `O que é a ${config.nomeSite}, como escolhemos os produtos e como o site se mantém.`,
  conteudo: `${cabPagina({ titulo: `Sobre a ${esc(config.nomeSite)}`, sub: "Um portal de descoberta de produtos: indicamos, você compra na loja.", icn: "etiqueta" })}
<div class="container secao texto" style="padding-top:24px">
  <p>A ${esc(config.nomeSite)} reúne produtos populares da Amazon, do Mercado Livre e da Shopee em um só lugar, para ajudar quem já sabe o que quer comprar a encontrar a oferta e a loja certas mais rápido.</p>
  <h2>O que fazemos</h2>
  <ul>
    <li>Selecionamos produtos procurados nas três lojas.</li>
    <li>Conferimos cada link antes de publicar.</li>
    <li>Mostramos em quais lojas o produto está e, quando é o mesmo item, comparamos.</li>
  </ul>
  <h2>O que não fazemos</h2>
  <p>${esc(NAO_SOMOS_LOJA)} Também não publicamos avaliações, notas ou números de vendas, e não temos parceria oficial com as lojas${programasConfirmados(config).length ? " além dos programas de afiliados" : ""}.</p>
  <h2>Nossos critérios</h2>
  <ul>${COMPROMISSOS.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
  <h2>Como o site se mantém</h2>
  <p>Quando você compra por um link do site, a loja pode nos pagar uma comissão, sem custo extra para você. Detalhes no <a href="/aviso-de-afiliados/">aviso de afiliados</a>.</p>
  <h2>Fale com a gente</h2>
  <p>Encontrou um link quebrado ou uma informação desatualizada? Veja a página de <a href="/contato/">contato</a>.</p>
</div>`,
});

export const paginaAvisoAfiliados = ({ config }) => ({
  titulo: `Aviso de afiliados | ${config.nomeSite}`,
  descricao: `Como a ${config.nomeSite} trabalha com links de afiliado e como isso afeta você.`,
  conteudo: `${cabPagina({ titulo: "Aviso de afiliados", sub: "Transparência sobre como ganhamos dinheiro.", icn: "escudo", tom: ["#e3f6ec", "#0f7a4a"] })}
<div class="container secao texto" style="padding-top:24px">
  <div class="caixa">
    <p style="margin-top:0">${esc(AVISO_CURTO)}</p>
    ${declaracaoAmazon(config) ? `<p><strong>${esc(declaracaoAmazon(config))}</strong></p>` : ""}
    <p style="margin-bottom:0">${esc(fraseProgramas(config))}</p>
  </div>
  <h2>O que isso significa para você</h2>
  <ul>
    <li>O preço que você paga é o mesmo da loja: a comissão sai da margem da loja, não do seu bolso.</li>
    <li>Os botões de compra levam direto à página do produto na loja. A compra, o pagamento, a entrega e as trocas são feitos com a loja.</li>
    <li>A comissão não muda o que publicamos: só entram produtos com link conferido, e não exibimos avaliações, notas ou números de vendas.</li>
    <li>Preços, frete e disponibilidade são definidos pelas lojas e podem mudar a qualquer momento. Sempre confira na loja antes de finalizar.</li>
  </ul>
  <p>Os links de afiliado ficam marcados no código da página como patrocinados (<code>rel="sponsored"</code>).</p>
</div>`,
});

export const paginaContato = ({ config }) => {
  const c = config.contato || {};
  const cartoes = [
    c.email ? `<div class="cartao-contato"><span class="bolha">${icone("mensagem", { tamanho: 22 })}</span><div><strong>E-mail</strong><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div></div>` : "",
    c.url ? `<div class="cartao-contato"><span class="bolha">${icone("mensagem", { tamanho: 22 })}</span><div><strong>Mensagem pública</strong><a href="${esc(c.url)}" rel="noopener">${esc(c.url.replace(/^https?:\/\//, ""))}</a></div></div>` : "",
  ].join("");
  return {
    titulo: `Contato | ${config.nomeSite}`,
    descricao: `Como falar com a ${config.nomeSite}.`,
    conteudo: `${cabPagina({ titulo: "Contato", sub: "Avise sobre links quebrados, informações desatualizadas ou fale sobre parcerias.", icn: "mensagem", tom: ["#e8edff", "#2546b8"] })}
<div class="container secao texto" style="padding-top:24px">
  <div class="cartoes-contato">${cartoes}</div>
  <h2>Sobre pedidos e entregas</h2>
  <p>${esc(NAO_SOMOS_LOJA)} Para pedidos, pagamentos, entregas e trocas, fale com a loja onde a compra foi feita.</p>
</div>`,
  };
};

export const paginaPrivacidade = ({ config }) => ({
  titulo: `Privacidade | ${config.nomeSite}`,
  descricao: `Política de privacidade da ${config.nomeSite}.`,
  conteudo: `${cabPagina({ titulo: "Privacidade", sub: "O que coletamos (quase nada) e como tratamos.", icn: "cadeado", tom: ["#eef1f5", "#3b4a63"] })}
<div class="container secao texto" style="padding-top:24px">
  <h2>Resumo</h2>
  <ul>
    <li>Não usamos cookies de rastreamento nem exibimos anúncios.</li>
    <li>Não pedimos cadastro nem dados pessoais.</li>
    <li>A busca do site roda no seu navegador; o termo buscado não é enviado para nós.</li>
  </ul>
  <h2>Cliques nos botões de loja</h2>
  ${config.endpointCliques
    ? `<p>Quando você clica em um botão de loja, registramos de forma anônima qual produto e qual loja foram clicados, a página de origem e a data. Não guardamos seu IP nem identificadores pessoais. Usamos esses números apenas para saber quais produtos interessam mais.</p>`
    : `<p>No momento, o site não registra os cliques dos visitantes.</p>`}
  <h2>Hospedagem e lojas</h2>
  <p>A hospedagem pode manter registros técnicos de acesso, como em qualquer site. Ao seguir para a Amazon, o Mercado Livre ou a Shopee, valem as políticas de privacidade de cada loja.</p>
</div>`,
});

export const pagina404 = ({ config }) => ({
  titulo: `Página não encontrada | ${config.nomeSite}`,
  descricao: "Página não encontrada.",
  conteudo: `${cabPagina({ titulo: "Página não encontrada", sub: "O endereço pode ter mudado. Que tal começar pela página inicial ou pela busca?", icn: "busca" })}
<div class="container secao"><a class="btn btn-prim" href="/">Ir para o início</a> <a class="btn btn-sec" href="/busca/">Buscar produtos</a></div>`,
});
