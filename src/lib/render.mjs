/**
 * Templates HTML (strings). Tudo renderizado no build: as páginas funcionam e são
 * indexáveis sem JavaScript. O JS do site só registra cliques.
 */
import { LOJAS } from "./links.mjs";
import { slugify } from "./catalogo.mjs";

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

const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

export const layout = ({ config, titulo, descricao, caminho, conteudo, jsonld = [], indexavel = true, exemplo = false, categorias = [] }) => {
  const url = `${config.siteUrl}${caminho}`;
  const robots = indexavel && !exemplo ? "index, follow" : "noindex, follow";
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
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="pt_BR">
<meta name="theme-color" content="#0f766e">
${config.verificacao?.google ? `<meta name="google-site-verification" content="${esc(config.verificacao.google)}">` : ""}
${config.verificacao?.bing ? `<meta name="msvalidate.01" content="${esc(config.verificacao.bing)}">` : ""}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
${jsonld.map(jsonLd).join("\n")}
</head>
<body data-endpoint="${esc(config.endpointCliques || "")}">
${exemplo ? `<div class="faixa-exemplo">PRÉ-VISUALIZAÇÃO COM DADOS FICTÍCIOS — não publicar</div>` : ""}
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">
  <div class="container topo-linha">
    <a class="marca" href="/">${esc(config.nomeSite)}</a>
    <nav class="nav-categorias" aria-label="Categorias">
      ${categorias.map((c) => `<a href="/categoria/${c.slug}/">${esc(c.nome)}</a>`).join("")}
    </nav>
  </div>
  <p class="aviso-topo">${esc(AVISO_CURTO)}</p>
</header>
<main id="conteudo" class="container">
${conteudo}
</main>
<footer class="rodape">
  <div class="container">
    <p><strong>Aviso de afiliados.</strong> ${esc(AVISO_CURTO)} ${esc(AVISO_AMAZON)} Preços e disponibilidade são definidos pelas lojas e podem mudar a qualquer momento.</p>
    <nav aria-label="Institucional"><a href="/">Início</a> · <a href="/sobre/">Sobre</a> · <a href="/aviso-de-afiliados/">Aviso de afiliados</a> · <a href="/contato/">Contato</a> · <a href="/privacidade/">Privacidade</a></nav>
    <p class="mini">© ${new Date().getFullYear()} ${esc(config.nomeSite)}</p>
  </div>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>
`;
};

const selosLojas = (ofertas) =>
  ofertas.map((o) => `<span class="selo selo-${o.loja}">${esc(LOJAS[o.loja].nome)}</span>`).join("");

export const cardProduto = (p, ativas) => `<article class="card">
  <a class="card-link" href="/produto/${p.id}/">
    <span class="card-cat">${esc(p.categoria)}</span>
    <h3>${esc(p.nome)}</h3>
    ${p.marca ? `<span class="card-marca">${esc(p.marca)}</span>` : ""}
  </a>
  <div class="card-lojas">${selosLojas(ativas)}</div>
  <a class="btn btn-sec" href="/produto/${p.id}/">Ver ofertas</a>
</article>`;

const COMPROMISSOS = [
  "Só publicamos ofertas com link de afiliado conferido antes de entrar no site.",
  "Não exibimos avaliações, notas, números de vendas ou descontos: esses dados ficam na loja.",
  "Preço só aparece quando foi consultado recentemente, sempre com data. Na Amazon, o preço é sempre conferido na própria loja.",
  "A comparação entre lojas só é feita quando confirmamos que é o mesmo produto.",
];

const blocoComoFunciona = () => `<section aria-labelledby="t-como">
  <h2 id="t-como">Como funciona</h2>
  <ol class="passos">
    <li><strong>Selecionamos</strong> produtos populares nas três lojas.</li>
    <li><strong>Conferimos</strong> o link, o produto e a loja antes de publicar.</li>
    <li><strong>Você compra</strong> direto na Amazon, no Mercado Livre ou na Shopee, com as garantias e a política de cada loja.</li>
  </ol>
</section>
<section aria-labelledby="t-compromissos">
  <h2 id="t-compromissos">Nossos compromissos</h2>
  <ul class="compromissos">${COMPROMISSOS.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
</section>`;

export const paginaInicial = ({ config, destaques, categorias, todos }) => {
  const temProdutos = destaques.length + todos.length > 0;
  const conteudo = `
<section class="hero">
  <h1>${temProdutos ? "Produtos populares com links verificados" : `${esc(config.nomeSite)}: achados da Amazon, do Mercado Livre e da Shopee`}</h1>
  <p>${esc(config.descricaoSite)}</p>
</section>
${destaques.length ? `<section aria-labelledby="t-destaques">
  <h2 id="t-destaques">Destaques</h2>
  <div class="grade">${destaques.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
</section>` : ""}
${categorias.length ? `<section aria-labelledby="t-categorias">
  <h2 id="t-categorias">Categorias</h2>
  <ul class="lista-categorias">${categorias.map((c) => `<li><a href="/categoria/${c.slug}/">${esc(c.nome)} <span>${c.total}</span></a></li>`).join("")}</ul>
</section>` : ""}
${todos.length ? `<section aria-labelledby="t-todos">
  <h2 id="t-todos">Todos os produtos</h2>
  <div class="grade">${todos.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
</section>` : ""}
${temProdutos ? "" : `<section class="aviso-preparo" aria-labelledby="t-preparo">
  <h2 id="t-preparo">Primeira seleção em preparação</h2>
  <p>Estamos conferindo os links e os anúncios dos primeiros produtos. Eles aparecem aqui assim que cada link for verificado. Não publicamos ofertas sem essa conferência.</p>
</section>`}
${blocoComoFunciona()}
<p class="sub">Saiba mais em <a href="/sobre/">Sobre</a> e no <a href="/aviso-de-afiliados/">aviso de afiliados</a>.</p>`;
  return {
    titulo: `${config.nomeSite}: produtos populares com links verificados`,
    descricao: config.descricaoSite,
    conteudo,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: config.nomeSite, url: `${config.siteUrl}/`, inLanguage: "pt-BR" }],
  };
};

export const paginaCategoria = ({ config, categoria, itens }) => {
  const conteudo = `
<nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <span>${esc(categoria.nome)}</span></nav>
<h1>${esc(categoria.nome)}</h1>
<p class="sub">${itens.length} ${itens.length === 1 ? "produto" : "produtos"} com link verificado em ${esc(categoria.nome.toLowerCase())}.</p>
<div class="grade">${itens.map(({ p, ativas }) => cardProduto(p, ativas)).join("")}</div>
<p class="aviso-botoes">${esc(AVISO_CURTO)}</p>`;
  return {
    titulo: `${categoria.nome}: produtos populares com links verificados | ${config.nomeSite}`,
    descricao: `Produtos de ${categoria.nome.toLowerCase()} disponíveis na Amazon, Mercado Livre e Shopee, com links verificados e comparação entre lojas.`,
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
  <div class="oferta-loja">${esc(loja.nome)} ${destaque}</div>
  <div class="oferta-preco">${preco}</div>
  <a class="btn btn-${o.loja}" href="${esc(o.url)}" target="_blank" rel="sponsored nofollow noopener" data-oferta data-produto="${esc(p.id)}" data-loja="${o.loja}">${esc(loja.rotuloBotao)}</a>
</li>`;
    })
    .join("\n");
  const emVerificacao = inativas.length
    ? `<p class="em-verificacao">Também em verificação: ${inativas.map((o) => esc(LOJAS[o.loja]?.nome || o.loja)).join(", ")}.</p>`
    : "";
  const aviso = ativas.length > 1 && p.mesmoProdutoConfirmado !== true
    ? `<p class="nota">As ofertas podem ser de versões ou tamanhos diferentes. Confira o modelo na página da loja antes de comprar.</p>`
    : "";
  const pontos = (p.pontosChave || []).filter(Boolean);
  const descricao = (p.descricao || "").trim();
  const metaDesc = (descricao || `${p.nome}${p.marca ? ` (${p.marca})` : ""}: veja onde comprar na Amazon, Mercado Livre e Shopee com links verificados.`).slice(0, 155);

  const conteudo = `
<nav class="trilha" aria-label="Trilha"><a href="/">Início</a> › <a href="/categoria/${catSlug}/">${esc(p.categoria)}</a> › <span>${esc(p.nome)}</span></nav>
<article class="produto">
  <header class="produto-topo">
    <span class="card-cat">${esc(p.categoria)}</span>
    <h1>${esc(p.nome)}</h1>
    ${p.marca ? `<p class="sub">Marca: ${esc(p.marca)}</p>` : ""}
  </header>
  <section class="ofertas" aria-labelledby="t-onde">
    <h2 id="t-onde">Onde comprar</h2>
    <ul class="lista-ofertas">${linhas}</ul>
    ${aviso}
    ${emVerificacao}
    <p class="aviso-botoes">${esc(AVISO_CURTO)} ${ativas.some((o) => o.loja === "amazon") ? esc(AVISO_AMAZON) : ""}</p>
  </section>
  ${descricao ? `<section aria-labelledby="t-sobre"><h2 id="t-sobre">Sobre o produto</h2><p>${esc(descricao)}</p></section>` : ""}
  ${pontos.length ? `<section aria-labelledby="t-pontos"><h2 id="t-pontos">Destaques do anúncio</h2><ul class="pontos">${pontos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
  <p class="fonte">Informações conferidas a partir dos anúncios das lojas${p.fonte ? ` (${esc(p.fonte)})` : ""}. Confirme detalhes, preço e frete na loja antes de comprar.</p>
</article>
${relacionados.length ? `<section aria-labelledby="t-rel"><h2 id="t-rel">Mais em ${esc(p.categoria)}</h2><div class="grade">${relacionados.map(({ p: r, ativas: a }) => cardProduto(r, a)).join("")}</div></section>` : ""}`;

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

export const paginaSobre = ({ config }) => ({
  titulo: `Sobre | ${config.nomeSite}`,
  descricao: `O que é o ${config.nomeSite}, como escolhemos os produtos e como o site se mantém.`,
  conteudo: `<h1>Sobre o ${esc(config.nomeSite)}</h1>
<p>O ${esc(config.nomeSite)} reúne produtos populares da Amazon, do Mercado Livre e da Shopee em um só lugar, para ajudar quem já sabe o que quer comprar a encontrar a oferta e a loja certas mais rápido.</p>
<h2>Como escolhemos os produtos</h2>
<ul>${COMPROMISSOS.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
<h2>Como o site se mantém</h2>
<p>Participamos de programas de afiliados. Quando você compra por um link do site, a loja pode nos pagar uma comissão, sem custo extra para você. Detalhes no <a href="/aviso-de-afiliados/">aviso de afiliados</a>.</p>
<h2>Fale com a gente</h2>
<p>Encontrou um link quebrado ou uma informação desatualizada? Veja a página de <a href="/contato/">contato</a>.</p>`,
});

export const paginaAvisoAfiliados = ({ config }) => ({
  titulo: `Aviso de afiliados | ${config.nomeSite}`,
  descricao: `Como o ${config.nomeSite} participa dos programas de afiliados da Amazon, do Mercado Livre e da Shopee.`,
  conteudo: `<h1>Aviso de afiliados</h1>
<p>${esc(AVISO_CURTO)}</p>
<p><strong>${esc(AVISO_AMAZON)}</strong></p>
<p>Também participamos dos programas de afiliados do Mercado Livre e da Shopee.</p>
<h2>O que isso significa para você</h2>
<ul>
  <li>O preço que você paga é o mesmo da loja: a comissão sai da margem da loja, não do seu bolso.</li>
  <li>Os botões de compra levam direto à página do produto na loja. A compra, o pagamento, a entrega e as trocas são feitos com a loja.</li>
  <li>A comissão não muda o que publicamos: só entram produtos com link conferido, e não exibimos avaliações, notas ou números de vendas.</li>
  <li>Preços, frete e disponibilidade são definidos pelas lojas e podem mudar a qualquer momento. Sempre confira na loja antes de finalizar.</li>
</ul>
<p>Os links de afiliado ficam marcados no código da página como patrocinados (<code>rel="sponsored"</code>).</p>`,
});

export const paginaContato = ({ config }) => {
  const c = config.contato || {};
  const canais = [
    c.email ? `<li>E-mail: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : "",
    c.url ? `<li>Mensagem pública: <a href="${esc(c.url)}" rel="noopener">${esc(c.url.replace(/^https?:\/\//, ""))}</a></li>` : "",
  ].join("");
  return {
    titulo: `Contato | ${config.nomeSite}`,
    descricao: `Como falar com o ${config.nomeSite}.`,
    conteudo: `<h1>Contato</h1>
<p>Use os canais abaixo para avisar sobre links quebrados, informações desatualizadas ou para falar sobre parcerias.</p>
<ul>${canais}</ul>
<p>Pedidos, pagamentos, entregas e trocas são tratados diretamente com a loja onde a compra foi feita.</p>`,
  };
};

export const paginaPrivacidade = ({ config }) => ({
  titulo: `Privacidade | ${config.nomeSite}`,
  descricao: `Política de privacidade do ${config.nomeSite}.`,
  conteudo: `<h1>Privacidade</h1>
<p>Este site não usa cookies de rastreamento, não exibe anúncios e não pede dados pessoais.</p>
${config.endpointCliques
    ? `<p>Quando você clica em um botão de loja, registramos de forma anônima qual produto e qual loja foram clicados, a página de origem e a data. Não guardamos seu IP nem identificadores pessoais. Usamos esses números apenas para saber quais produtos interessam mais.</p>`
    : `<p>No momento, o site não registra os cliques dos visitantes.</p>`}
<p>A hospedagem pode manter registros técnicos de acesso, como em qualquer site. Ao seguir para a Amazon, o Mercado Livre ou a Shopee, valem as políticas de privacidade de cada loja.</p>`,
});

export const pagina404 = ({ config }) => ({
  titulo: `Página não encontrada | ${config.nomeSite}`,
  descricao: "Página não encontrada.",
  conteudo: `<h1>Página não encontrada</h1><p><a href="/">Voltar para o início</a></p>`,
});
