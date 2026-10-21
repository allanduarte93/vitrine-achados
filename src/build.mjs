#!/usr/bin/env node
/**
 * Gera o site estático em dist/ a partir do catálogo.
 *
 *   node src/build.mjs [--catalogo data/catalogo.json] [--saida dist] [--config config.json] [--exemplo]
 *
 * Só produtos com pelo menos uma oferta ativa (link válido e verificado) viram página.
 * Páginas sem conteúdo próprio suficiente saem com noindex e ficam fora do sitemap.
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCatalogo, somenteConfirmadas, ofertasAtivas, produtoIndexavel, slugify, resumoCatalogo } from "./lib/catalogo.mjs";
import { layout, paginaInicial, paginaCategoria, paginaProduto, paginaBusca, paginaComoFunciona, paginaSobre, paginaAvisoAfiliados, paginaContato, paginaPrivacidade, pagina404, paginaGuias, paginaGuia } from "./lib/render.mjs";
import { LOJAS } from "./lib/links.mjs";
import { canonicalizarCategoria } from "./lib/categorias.mjs";
import { avaliarGuias } from "./lib/guias.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const lerJson = (caminho) => JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));

export const build = ({ catalogoPath = "data/catalogo.json", saida = "dist", configPath = "config.json", guiasPath = "data/guias.json", categoriasPath = "data/categorias.json", exemplo = false, agora = new Date() } = {}) => {
  const config = lerJson(configPath);
  // Overrides por ambiente (usados no workflow de publicação, sem editar config.json).
  if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL;
  if (process.env.AMAZON_TAG) config.afiliados = { ...config.afiliados, amazonTag: process.env.AMAZON_TAG };
  if (process.env.ENDPOINT_CLIQUES !== undefined) config.endpointCliques = process.env.ENDPOINT_CLIQUES;
  config.siteUrl = String(config.siteUrl || "").replace(/\/+$/, "");
  // Subcaminho (ex.: usuario.github.io/repositorio): prefixa links internos "/...".
  const base = new URL(config.siteUrl).pathname.replace(/\/+$/, "");
  const comBase = (html) => (base ? html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${base}/`) : html);
  const lido = lerJson(catalogoPath);
  const catalogo = process.env.SOMENTE_CONFIRMADOS === "1" ? somenteConfirmadas(lido, config) : lido;
  const { erros, avisos } = validarCatalogo(catalogo, config, agora);
  if (erros.length) {
    const e = new Error(`Catálogo com ${erros.length} erro(s):\n- ${erros.join("\n- ")}`);
    e.erros = erros;
    throw e;
  }

  const out = resolve(RAIZ, saida);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const escrever = (rel, html) => {
    const f = join(out, rel);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, comBase(html));
  };

  const canonicas = config.categoriasVitrine || [];
  const itens = catalogo.produtos
    .map((p0) => {
      const p = { ...p0, categoria: canonicalizarCategoria(p0.categoria, canonicas) };
      const ativas = ofertasAtivas(p, config, agora);
      const inativas = p.ofertas.filter((o) => !ativas.some((a) => a.loja === o.loja));
      return { p, ativas, inativas, indexavel: produtoIndexavel(p, config, agora) };
    })
    .filter((x) => x.ativas.length > 0)
    .sort((a, b) => Number(!!b.p.prioritario) - Number(!!a.p.prioritario) || a.p.nome.localeCompare(b.p.nome, "pt-BR"));

  const catMap = new Map();
  itens.forEach((x) => {
    const slug = slugify(x.p.categoria);
    if (!catMap.has(slug)) catMap.set(slug, { slug, nome: x.p.categoria, itens: [] });
    catMap.get(slug).itens.push(x);
  });
  const comProdutos = [...catMap.values()].map((c) => ({ ...c, total: c.itens.length, indexavel: c.itens.some((x) => x.indexavel) }));
  // Vitrine sem nenhum produto (versão institucional): as categorias planejadas aparecem "em curadoria", noindex.
  // Com produtos publicados, a navegação comercial mostra só categorias abastecidas (nada de página vazia).
  const vazias = comProdutos.length
    ? []
    : canonicas.map((nome) => ({ slug: slugify(nome), nome, itens: [], total: 0, indexavel: false }));
  const ordem = (c) => {
    const i = canonicas.findIndex((n) => slugify(n) === c.slug);
    return i === -1 ? canonicas.length : i;
  };
  const categorias = [...comProdutos, ...vazias].sort((a, b) => ordem(a) - ordem(b) || a.nome.localeCompare(b.nome, "pt-BR"));
  const navCats = categorias.map(({ slug, nome, total }) => ({ slug, nome, total }));

  // Guias editoriais: só entram se TODOS os produtos citados estiverem publicados (nada de guia apontando para oferta oculta).
  const porId = new Map(itens.map((x) => [x.p.id, x]));
  const guiasDados = !exemplo && existsSync(resolve(RAIZ, guiasPath)) ? lerJson(guiasPath).guias || [] : [];
  const { aprovados: guias, rejeitados: guiasRejeitados, avisos: avisosGuias } = avaliarGuias(guiasDados, {
    publicados: new Set(porId.keys()),
    descricoes: itens.map((x) => x.p.descricao || "").filter(Boolean),
    agora,
  });
  const textosCategoria = !exemplo && existsSync(resolve(RAIZ, categoriasPath)) ? lerJson(categoriasPath).categorias || {} : {};
  const guiasDoProduto = (id) => guias.filter((g) => g.produtos.includes(id));

  const paginas = []; // {caminho, indexavel}
  const render = (caminho, pagina, indexavel = true) => {
    const html = layout({ config, caminho, indexavel, exemplo, categorias: navCats, temGuias: guias.length > 0, ...pagina });
    escrever(caminho === "/" ? "index.html" : `${caminho.replace(/^\//, "")}index.html`, html);
    paginas.push({ caminho, indexavel: indexavel && !exemplo });
  };

  render("/", paginaInicial({ config, destaques: itens.filter((x) => x.p.prioritario).slice(0, 10), categorias, todos: itens.filter((x) => !x.p.prioritario), guias }));
  categorias.forEach((c) => render(`/categoria/${c.slug}/`, paginaCategoria({ config, categoria: c, itens: c.itens, outras: categorias.filter((o) => o.slug !== c.slug), intro: textosCategoria[c.slug] || null, guias: guias.filter((g) => g.produtos.some((id) => slugify(porId.get(id).p.categoria) === c.slug)) }), c.indexavel));
  itens.forEach((x) => {
    const relacionados = (catMap.get(slugify(x.p.categoria))?.itens || []).filter((r) => r.p.id !== x.p.id).slice(0, 4);
    render(`/produto/${x.p.id}/`, paginaProduto({ config, p: x.p, ativas: x.ativas, inativas: x.inativas, relacionados, guias: guiasDoProduto(x.p.id) }), x.indexavel);
  });
  guias.forEach((g) => render(`/guias/${g.slug}/`, paginaGuia({ config, guia: g, itens: g.produtos.map((id) => porId.get(id)), outrosGuias: guias.filter((o) => o.slug !== g.slug).slice(0, 4) })));
  if (guias.length) render("/guias/", paginaGuias({ config, guias }));
  render("/como-funciona/", paginaComoFunciona({ config }));
  const lojasPublicadas = [...new Set(itens.flatMap((x) => x.ativas.map((o) => o.loja)))];
  render("/busca/", paginaBusca({ config, ...(lojasPublicadas.length ? { lojas: lojasPublicadas } : {}) }), false);
  render("/sobre/", paginaSobre({ config }));
  render("/aviso-de-afiliados/", paginaAvisoAfiliados({ config }));
  render("/contato/", paginaContato({ config }));
  render("/privacidade/", paginaPrivacidade({ config }), false);
  writeFileSync(join(out, "404.html"), comBase(layout({ config, caminho: "/404", indexavel: false, exemplo, categorias: navCats, temGuias: guias.length > 0, ...pagina404({ config }) })));

  const hoje = agora.toISOString().slice(0, 10);
  const urls = paginas.filter((x) => x.indexavel);
  writeFileSync(
    join(out, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${config.siteUrl}${u.caminho}</loc><lastmod>${hoje}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`
  );
  // Feed Atom: guias e páginas de produto indexáveis (mais recentes primeiro).
  const xml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const iso = (d) => new Date(d || agora).toISOString();
  const entradas = [
    ...guias.map((g) => ({ titulo: g.titulo, url: `${config.siteUrl}/guias/${g.slug}/`, resumo: g.resumo, atualizado: g.atualizadoEm, publicado: g.publicadoEm || g.atualizadoEm })),
    ...itens.filter((x) => x.indexavel).map((x) => ({ titulo: x.p.nome, url: `${config.siteUrl}/produto/${x.p.id}/`, resumo: (x.p.descricao || "").slice(0, 280), atualizado: x.p.atualizadoEm, publicado: x.p.atualizadoEm })),
  ].sort((a, b) => new Date(b.atualizado || 0) - new Date(a.atualizado || 0));
  const feedAtualizado = entradas.length ? iso(entradas[0].atualizado) : iso(agora);
  if (!exemplo) {
    writeFileSync(
      join(out, "feed.xml"),
      `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pt-BR">\n  <title>${xml(config.nomeSite)}: novidades</title>\n  <subtitle>Guias de compra e produtos com links conferidos.</subtitle>\n  <link href="${config.siteUrl}/feed.xml" rel="self" type="application/atom+xml"/>\n  <link href="${config.siteUrl}/" rel="alternate" type="text/html"/>\n  <id>${config.siteUrl}/</id>\n  <updated>${feedAtualizado}</updated>\n  <author><name>${xml(config.nomeSite)}</name></author>\n${entradas
        .map((e) => `  <entry>\n    <title>${xml(e.titulo)}</title>\n    <link href="${e.url}" rel="alternate" type="text/html"/>\n    <id>${e.url}</id>\n    <published>${iso(e.publicado)}</published>\n    <updated>${iso(e.atualizado)}</updated>\n    <summary>${xml(e.resumo)}</summary>\n  </entry>`)
        .join("\n")}\n</feed>\n`
    );
  }
  writeFileSync(
    join(out, "robots.txt"),
    exemplo ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );
  cpSync(resolve(RAIZ, "assets"), join(out, "assets"), { recursive: true });
  // Arquivos servidos na raiz do site (verificação do Search Console, chave do IndexNow).
  if (!exemplo && existsSync(resolve(RAIZ, "static"))) cpSync(resolve(RAIZ, "static"), out, { recursive: true });
  const indice = itens.map(({ p, ativas }) => {
    const comPreco = ativas.filter((o) => o.estado.mostrarPreco);
    return {
      id: p.id,
      nome: p.nome,
      marca: p.marca || "",
      categoria: p.categoria,
      lojas: ativas.map((o) => LOJAS[o.loja].nome),
      preco: comPreco.length ? Math.min(...comPreco.map((o) => o.preco)) : null,
      url: `${base}/produto/${p.id}/`,
    };
  });
  writeFileSync(join(out, "busca.json"), JSON.stringify({ base, produtos: indice }));

  return {
    paginas: paginas.length,
    indexaveis: urls.length,
    produtosPublicados: itens.length,
    categorias: categorias.length,
    guias: guias.length,
    guiasRejeitados,
    avisos: [...avisos, ...avisosGuias],
    resumo: resumoCatalogo(catalogo, config, agora),
    saida: out,
  };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (nome, padrao) => {
    const i = process.argv.indexOf(nome);
    return i > -1 ? process.argv[i + 1] : padrao;
  };
  try {
    const r = build({
      catalogoPath: arg("--catalogo", "data/catalogo.json"),
      saida: arg("--saida", "dist"),
      configPath: arg("--config", "config.json"),
      exemplo: process.argv.includes("--exemplo"),
    });
    r.avisos.forEach((a) => console.log(`aviso: ${a}`));
    console.log(`\n${r.paginas} páginas geradas (${r.indexaveis} indexáveis) em ${r.saida}`);
    console.log(`Produtos publicados: ${r.produtosPublicados}/${r.resumo.produtos} · categorias: ${r.categorias}`);
    console.log(`Ofertas ativas por loja: ${JSON.stringify(r.resumo.porLoja)}`);
    console.log(`Guias publicados: ${r.guias}`);
    r.guiasRejeitados.forEach((g) => console.log(`guia NÃO publicado: ${g.slug} — ${g.motivos.join("; ")}`));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
