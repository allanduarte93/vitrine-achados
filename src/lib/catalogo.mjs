/**
 * Catálogo canônico (data/catalogo.json): validação e regras de exibição.
 *
 * Princípios:
 * - Botão de compra só fica ativo com link estruturalmente válido E verificado.
 * - Preço da Amazon nunca é exibido (a Amazon só permite preço vindo da API oficial).
 * - Preços de Mercado Livre/Shopee só aparecem se coletados há até `precoValidadeHoras`,
 *   sempre com data da coleta.
 * - Nada de avaliações, notas, "mais vendido" ou descontos sem fonte: o esquema não tem
 *   esses campos, e campos desconhecidos geram aviso.
 */
import { LOJAS, validarLinkAfiliado } from "./links.mjs";

export const MAX_PRIORITARIOS = 10;

export const slugify = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const CAMPOS_PRODUTO = new Set([
  "id", "nome", "marca", "categoria", "prioritario", "descricao", "pontosChave",
  "imagem", "imagemPermitida", "imagemFonte", "fonte", "mesmoProdutoConfirmado", "ofertas", "atualizadoEm",
]);
const CAMPOS_OFERTA = new Set([
  "loja", "url", "linkVerificado", "verificadoEm", "verificadoPor", "preco",
  "precoColetadoEm", "identificador", "titulo",
]);
const CAMPOS_PROIBIDOS = /avalia|rating|nota|estrela|review|vendid|desconto|cupom|depoimento/i;

const isDate = (s) => typeof s === "string" && !Number.isNaN(Date.parse(s));

/**
 * Estado de uma oferta para exibição.
 * @returns {{ativa: boolean, motivo?: string, mostrarPreco: boolean}}
 */
export const estadoOferta = (oferta, config, agora = new Date()) => {
  const link = validarLinkAfiliado(oferta.loja, oferta.url, config.afiliados || {});
  let ativa = link.ok && oferta.linkVerificado === true && isDate(oferta.verificadoEm);
  let motivo;
  if (!link.ok) motivo = link.motivo;
  else if (oferta.linkVerificado !== true) motivo = "link ainda não verificado";
  else if (!isDate(oferta.verificadoEm)) motivo = "verificação sem data";
  if (!ativa) return { ativa: false, motivo, mostrarPreco: false };

  const horas = config.precoValidadeHoras ?? 24;
  const mostrarPreco =
    oferta.loja !== "amazon" &&
    typeof oferta.preco === "number" &&
    oferta.preco > 0 &&
    isDate(oferta.precoColetadoEm) &&
    (agora - new Date(oferta.precoColetadoEm)) / 36e5 <= horas &&
    new Date(oferta.precoColetadoEm) <= agora;
  return { ativa: true, mostrarPreco };
};

export const ofertasAtivas = (produto, config, agora) =>
  produto.ofertas
    .map((o) => ({ ...o, estado: estadoOferta(o, config, agora) }))
    .filter((o) => o.estado.ativa);

/** Página indexável só com oferta ativa e conteúdo próprio mínimo (evita página rasa). */
export const produtoIndexavel = (produto, config, agora) => {
  if (ofertasAtivas(produto, config, agora).length === 0) return false;
  const desc = (produto.descricao || "").trim();
  const pontos = (produto.pontosChave || []).filter((p) => String(p).trim().length > 0);
  return desc.length >= 120 || pontos.length >= 3;
};

/**
 * Valida o catálogo inteiro.
 * @returns {{erros: string[], avisos: string[]}}
 */
export const validarCatalogo = (catalogo, config, agora = new Date()) => {
  const erros = [];
  const avisos = [];
  if (!catalogo || !Array.isArray(catalogo.produtos)) {
    return { erros: ["catálogo sem lista 'produtos'"], avisos };
  }
  const ids = new Set();
  let prioritarios = 0;

  catalogo.produtos.forEach((p, i) => {
    const ref = `produto[${i}]${p?.id ? ` (${p.id})` : ""}`;
    if (!p || typeof p !== "object") return erros.push(`${ref}: não é um objeto`);
    if (!p.id || p.id !== slugify(p.id)) erros.push(`${ref}: id ausente ou fora do formato slug`);
    if (ids.has(p.id)) erros.push(`${ref}: id duplicado`);
    ids.add(p.id);
    if (!p.nome || String(p.nome).trim().length < 3) erros.push(`${ref}: nome ausente`);
    if (!p.categoria) erros.push(`${ref}: categoria ausente`);
    if (p.prioritario === true) prioritarios++;
    if (!Array.isArray(p.ofertas)) {
      erros.push(`${ref}: 'ofertas' precisa ser uma lista`);
      return;
    }
    Object.keys(p).forEach((k) => {
      if (!CAMPOS_PRODUTO.has(k)) {
        (CAMPOS_PROIBIDOS.test(k) ? erros : avisos).push(
          `${ref}: campo "${k}" ${CAMPOS_PROIBIDOS.test(k) ? "não permitido (avaliações/vendas/descontos sem fonte)" : "desconhecido, será ignorado"}`
        );
      }
    });
    if (p.imagem && p.imagemPermitida !== true) {
      avisos.push(`${ref}: imagem ignorada — marque imagemPermitida só se o uso for autorizado pela loja/fabricante`);
    }
    const lojas = new Set();
    p.ofertas.forEach((o, j) => {
      const oref = `${ref}.ofertas[${j}]`;
      if (!LOJAS[o.loja]) return erros.push(`${oref}: loja inválida "${o.loja}"`);
      if (lojas.has(o.loja)) avisos.push(`${oref}: mais de uma oferta da mesma loja`);
      lojas.add(o.loja);
      Object.keys(o).forEach((k) => {
        if (!CAMPOS_OFERTA.has(k)) {
          (CAMPOS_PROIBIDOS.test(k) ? erros : avisos).push(`${oref}: campo "${k}" ${CAMPOS_PROIBIDOS.test(k) ? "não permitido" : "desconhecido, será ignorado"}`);
        }
      });
      if (o.preco != null && (typeof o.preco !== "number" || o.preco <= 0)) erros.push(`${oref}: preço inválido`);
      if (o.preco != null && !isDate(o.precoColetadoEm)) erros.push(`${oref}: preço sem data de coleta`);
      if (o.loja === "amazon" && o.preco != null) avisos.push(`${oref}: preço da Amazon nunca é exibido (regra do programa)`);
      const st = estadoOferta(o, config, agora);
      if (!st.ativa) avisos.push(`${oref}: botão DESATIVADO — ${st.motivo}`);
    });
    if (p.ofertas.length > 1 && p.mesmoProdutoConfirmado !== true) {
      avisos.push(`${ref}: várias lojas sem 'mesmoProdutoConfirmado' — a comparação de preço fica desligada`);
    }
  });

  if (prioritarios > MAX_PRIORITARIOS) erros.push(`${prioritarios} produtos prioritários (máximo ${MAX_PRIORITARIOS})`);
  if (!config.afiliados?.amazonTag) avisos.push("config.afiliados.amazonTag não definido — a tag dos links da Amazon não é conferida");
  return { erros, avisos };
};

/** Resumo para relatórios. */
export const resumoCatalogo = (catalogo, config, agora = new Date()) => {
  const produtos = catalogo.produtos || [];
  const comOferta = produtos.filter((p) => ofertasAtivas(p, config, agora).length > 0);
  const indexaveis = produtos.filter((p) => produtoIndexavel(p, config, agora));
  const porLoja = {};
  produtos.forEach((p) =>
    p.ofertas.forEach((o) => {
      const st = estadoOferta(o, config, agora);
      porLoja[o.loja] ??= { total: 0, ativas: 0 };
      porLoja[o.loja].total++;
      if (st.ativa) porLoja[o.loja].ativas++;
    })
  );
  return {
    produtos: produtos.length,
    prioritarios: produtos.filter((p) => p.prioritario).length,
    comOfertaAtiva: comOferta.length,
    indexaveis: indexaveis.length,
    porLoja,
  };
};

/**
 * Decide se o site pode ir para o ar.
 * - Institucional (sem ofertas ativas): exige URL pública real e um canal de contato.
 * - Comercial: além disso, se houver oferta ativa da Amazon, exige a tag configurada
 *   (sem ela não dá para garantir que os links são da nossa conta).
 * Páginas comerciais continuam dependendo de links verificados (regra de estadoOferta).
 */
/**
 * Recorte para publicação: mantém só as ofertas das lojas com participação confirmada
 * (config.afiliados.programasConfirmados) e descarta produtos que ficarem sem oferta.
 * Ativado com SOMENTE_CONFIRMADOS=1 (workflow Publicar); a prévia local mostra tudo.
 */
export const somenteConfirmadas = (catalogo, config) => {
  const ok = config.afiliados?.programasConfirmados || {};
  const produtos = catalogo.produtos
    .map((p) => ({ ...p, ofertas: (p.ofertas || []).filter((o) => ok[o.loja] === true) }))
    .filter((p) => p.ofertas.length);
  return { ...catalogo, produtos };
};

export const avaliarPublicacao = (catalogo, config, agora = new Date()) => {
  const { erros } = validarCatalogo(catalogo, config, agora);
  const r = resumoCatalogo(catalogo, config, agora);
  const modo = r.comOfertaAtiva > 0 ? "comercial" : "institucional";
  const pendencias = [...erros.map((e) => `catálogo: ${e}`)];
  const observacoes = [];
  if (!/^https:\/\//.test(config.siteUrl || "") || /exemplo\.invalid/.test(config.siteUrl)) pendencias.push("siteUrl ainda não é o endereço público real");
  if (!config.contato?.email && !config.contato?.url) pendencias.push("nenhum canal de contato em config.contato");
  const confirmados = config.afiliados?.programasConfirmados || {};
  for (const [loja, v] of Object.entries(r.porLoja)) {
    if (v.ativas > 0 && confirmados[loja] !== true) {
      pendencias.push(`há ofertas ativas de ${loja} e a participação do site nesse programa não está confirmada (config.afiliados.programasConfirmados.${loja})`);
    }
  }
  if ((r.porLoja.amazon?.ativas || 0) > 0 && !config.afiliados?.amazonTag) {
    pendencias.push("há ofertas da Amazon ativas e a tag de Associado não está configurada (AMAZON_TAG)");
  }
  if (modo === "institucional") observacoes.push("versão institucional: nenhuma página de produto ou botão de compra será publicado");
  else if (r.indexaveis < r.comOfertaAtiva) observacoes.push(`${r.comOfertaAtiva - r.indexaveis} página(s) de produto sairão com noindex por falta de descrição/pontos-chave`);
  return { modo, pendencias, observacoes, resumo: r };
};
