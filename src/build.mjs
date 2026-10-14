#!/usr/bin/env node
/**
 * Gera o site estático em dist/ a partir do catálogo.
 *
 *   node src/build.mjs [--catalogo data/catalogo.json] [--saida dist] [--config config.json] [--exemplo]
 *
 * Só produtos com pelo menos uma oferta ativa (link válido e verificado) viram página.
 * Páginas sem conteúdo próprio suficiente saem com noindex e ficam fora do sitemap.
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCatalogo, ofertasAtivas, produtoIndexavel, slugify, resumoCatalogo } from "./lib/catalogo.mjs";
import { layout, paginaInicial, paginaCategoria, paginaProduto, paginaSobre, paginaPrivacidade, pagina404 } from "./lib/render.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const lerJson = (caminho) => JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));

export const build = ({ catalogoPath = "data/catalogo.json", saida = "dist", configPath = "config.json", exemplo = false, agora = new Date() } = {}) => {
  const config = lerJson(configPath);
  // Overrides por ambiente (usados no workflow de publicação, sem editar config.json).
  if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL;
  if (process.env.AMAZON_TAG) config.afiliados = { ...config.afiliados, amazonTag: process.env.AMAZON_TAG };
  if (process.env.ENDPOINT_CLIQUES !== undefined) config.endpointCliques = process.env.ENDPOINT_CLIQUES;
  config.siteUrl = String(config.siteUrl || "").replace(/\/+$/, "");
  // Subcaminho (ex.: usuario.github.io/repositorio): prefixa links internos "/...".
  const base = new URL(config.siteUrl).pathname.replace(/\/+$/, "");
  const comBase = (html) => (base ? html.replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`) : html);
  const catalogo = lerJson(catalogoPath);
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

  const itens = catalogo.produtos
    .map((p) => {
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
  const categorias = [...catMap.values()]
    .map((c) => ({ ...c, total: c.itens.length, indexavel: c.itens.some((x) => x.indexavel) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const navCats = categorias.map(({ slug, nome }) => ({ slug, nome }));

  const paginas = []; // {caminho, indexavel}
  const render = (caminho, pagina, indexavel = true) => {
    const html = layout({ config, caminho, indexavel, exemplo, categorias: navCats, ...pagina });
    escrever(caminho === "/" ? "index.html" : `${caminho.replace(/^\//, "")}index.html`, html);
    paginas.push({ caminho, indexavel: indexavel && !exemplo });
  };

  render("/", paginaInicial({ config, destaques: itens.filter((x) => x.p.prioritario).slice(0, 10), categorias, todos: itens.filter((x) => !x.p.prioritario) }));
  categorias.forEach((c) => render(`/categoria/${c.slug}/`, paginaCategoria({ config, categoria: c, itens: c.itens }), c.indexavel));
  itens.forEach((x) => {
    const relacionados = (catMap.get(slugify(x.p.categoria))?.itens || []).filter((r) => r.p.id !== x.p.id).slice(0, 4);
    render(`/produto/${x.p.id}/`, paginaProduto({ config, p: x.p, ativas: x.ativas, inativas: x.inativas, relacionados }), x.indexavel);
  });
  render("/sobre/", paginaSobre({ config }));
  render("/privacidade/", paginaPrivacidade({ config }), false);
  writeFileSync(join(out, "404.html"), comBase(layout({ config, caminho: "/404", indexavel: false, exemplo, categorias: navCats, ...pagina404({ config }) })));

  const hoje = agora.toISOString().slice(0, 10);
  const urls = paginas.filter((x) => x.indexavel);
  writeFileSync(
    join(out, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${config.siteUrl}${u.caminho}</loc><lastmod>${hoje}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`
  );
  writeFileSync(
    join(out, "robots.txt"),
    exemplo ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );
  cpSync(resolve(RAIZ, "assets"), join(out, "assets"), { recursive: true });

  return {
    avisos,
    paginas: paginas.length,
    indexaveis: urls.length,
    produtosPublicados: itens.length,
    categorias: categorias.length,
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
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
