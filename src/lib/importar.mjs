/**
 * Importa pesquisas do Cowork (formato flexível) para o catálogo canônico.
 *
 * Aceita:
 *  - lista na raiz, ou objeto com `produtos` | `products` | `itens` | `items`;
 *  - um item por produto com ofertas aninhadas (`ofertas`, `offers`, `lojas`, `links`);
 *  - um item por produto com campos por loja (`amazon`, `link_amazon`, `amazon_url`, ...);
 *  - uma linha por loja (`produto` + `plataforma` + `link`) — agrupadas pelo nome.
 *
 * Nunca inventa dados: um link só sai como verificado se a fonte disser isso
 * explicitamente E houver data de verificação (do item ou do arquivo).
 * Campos de avaliação, vendas ou desconto são descartados e listados no relatório.
 */
import { normalizarLoja } from "./links.mjs";
import { slugify } from "./catalogo.mjs";

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return undefined;
};

const DESCARTAR = /avalia|rating|nota|estrela|review|vendid|vendas|desconto|cupom|depoimento|comiss/i;

const truthy = (v) => {
  if (v === true) return true;
  if (typeof v === "string") return /^(sim|true|ok|valido|válido|verificado|validado|ativo|yes)$/i.test(v.trim());
  return false;
};

const toNumber = (v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[^\d,.]/g, "");
  if (!s) return undefined;
  // "1.299,90" -> 1299.90 ; "1299.90" -> 1299.90
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const toArray = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") return v.split(/\n|;|•/).map((x) => x.trim()).filter(Boolean);
  return [];
};

const isPrioritario = (item) => {
  const v = pick(item, "prioritario", "prioritário", "top10", "destaque", "priority", "prioridade");
  if (v === true) return true;
  if (typeof v === "number") return v >= 1 && v <= 10;
  if (typeof v === "string") return /^(sim|true|alta|high|top|1?\d)$/i.test(v.trim()) && !/^0$/.test(v.trim());
  return false;
};

/** Converte uma "oferta" da fonte em oferta canônica. */
const mapOferta = (raw, lojaHint, dataArquivo, descartados, ref) => {
  const obj = typeof raw === "string" ? { url: raw } : raw || {};
  const url = pick(obj, "url", "link", "link_afiliado", "linkAfiliado", "affiliate_url", "affiliateUrl", "affiliateLink", "href");
  const loja = normalizarLoja(pick(obj, "loja", "plataforma", "store", "marketplace", "site") || lojaHint, url);
  if (!loja || !url) return null;
  Object.keys(obj).forEach((k) => DESCARTAR.test(k) && descartados.push(`${ref} ${loja}: campo "${k}" descartado`));

  const flag = pick(obj, "linkVerificado", "verificado", "validado", "valido", "válido", "verified", "valid", "status");
  const verificadoEm = pick(obj, "verificadoEm", "validadoEm", "data_validacao", "dataValidacao", "verifiedAt", "checkedAt") || (truthy(flag) ? dataArquivo : undefined);
  const verificado = truthy(flag) && !!verificadoEm && !Number.isNaN(Date.parse(verificadoEm));

  const oferta = {
    loja,
    url: String(url).trim(),
    linkVerificado: verificado,
  };
  if (verificado) oferta.verificadoEm = verificadoEm;
  const por = pick(obj, "verificadoPor", "validadoPor", "verifiedBy");
  if (verificado) oferta.verificadoPor = por || "cowork";
  const preco = toNumber(pick(obj, "preco", "preço", "price", "valor"));
  const precoEm = pick(obj, "precoColetadoEm", "data_preco", "dataPreco", "coletadoEm", "priceCheckedAt");
  if (preco && precoEm && !Number.isNaN(Date.parse(precoEm))) {
    oferta.preco = preco;
    oferta.precoColetadoEm = precoEm;
  } else if (preco) {
    descartados.push(`${ref} ${loja}: preço descartado (sem data de coleta)`);
  }
  const ident = pick(obj, "identificador", "asin", "mlb", "item_id", "itemId", "sku", "id_produto");
  if (ident) oferta.identificador = String(ident);
  const titulo = pick(obj, "titulo", "title", "nome_na_loja");
  if (titulo) oferta.titulo = String(titulo);
  return oferta;
};

const lerItens = (fonte) => {
  if (Array.isArray(fonte)) return fonte;
  return pick(fonte, "produtos", "products", "itens", "items", "catalogo", "catalog") || [];
};

/**
 * @returns {{produtos: object[], descartados: string[], ignorados: string[]}}
 */
export const normalizarPesquisa = (fonte) => {
  const dataArquivo = pick(fonte, "verificadoEm", "validadoEm", "dataValidacao", "geradoEm", "data", "date", "generatedAt");
  const nomeFonte = pick(fonte, "fonte", "source") || "Cowork";
  const descartados = [];
  const ignorados = [];
  const porId = new Map();

  lerItens(fonte).forEach((item, i) => {
    const nome = pick(item, "nome", "name", "titulo", "title", "produto", "product");
    if (!nome) {
      ignorados.push(`item[${i}]: sem nome`);
      return;
    }
    const marca = pick(item, "marca", "brand");
    const id = slugify(pick(item, "id", "slug") || [nome, marca].filter(Boolean).join(" "));
    const ref = `item[${i}] (${id})`;
    Object.keys(item).forEach((k) => DESCARTAR.test(k) && descartados.push(`${ref}: campo "${k}" descartado`));

    const atual = porId.get(id) || {
      id,
      nome: String(nome).trim(),
      ...(marca ? { marca: String(marca).trim() } : {}),
      categoria: String(pick(item, "categoria", "category", "nicho", "departamento") || "Outros").trim(),
      prioritario: false,
      fonte: dataArquivo ? `${nomeFonte} ${String(dataArquivo).slice(0, 10)}` : nomeFonte,
      ofertas: [],
    };
    if (isPrioritario(item)) atual.prioritario = true;
    const desc = pick(item, "descricao", "descrição", "description", "resumo");
    if (desc && !atual.descricao) atual.descricao = String(desc).trim();
    const pontos = toArray(pick(item, "pontosChave", "pontos_chave", "caracteristicas", "características", "features", "bullets"));
    if (pontos.length && !atual.pontosChave) atual.pontosChave = pontos;
    // Imagem só entra com autorização explícita e fonte registrada (ex.: materiais do programa de afiliados).
    const imagem = pick(item, "imagem", "image", "imagemUrl", "foto");
    if (imagem && !atual.imagem && /^https:\/\//.test(String(imagem).trim())) {
      atual.imagem = String(imagem).trim();
      atual.imagemPermitida = truthy(pick(item, "imagemPermitida", "imagem_permitida", "imageAllowed")) === true;
      const fonteImg = pick(item, "imagemFonte", "imagem_fonte", "imageSource");
      if (fonteImg) atual.imagemFonte = String(fonteImg).trim();
    }
    // Ficha visual (sem foto): tipo do produto e até 3 fatos curtos conferidos no anúncio.
    const tipo = pick(item, "tipo", "tipoProduto");
    if (tipo && !atual.tipo) atual.tipo = String(tipo).trim();
    const destaques = toArray(pick(item, "destaques", "highlights"));
    if (destaques.length && !atual.destaques) atual.destaques = destaques.slice(0, 3);
    const mesmo = pick(item, "mesmoProdutoConfirmado", "mesmo_produto", "sameProduct");
    if (mesmo !== undefined) atual.mesmoProdutoConfirmado = truthy(mesmo);

    const add = (o) => o && atual.ofertas.push(o);
    const aninhadas = pick(item, "ofertas", "offers", "lojas", "links");
    if (Array.isArray(aninhadas)) aninhadas.forEach((o) => add(mapOferta(o, undefined, dataArquivo, descartados, ref)));
    else if (aninhadas && typeof aninhadas === "object") {
      Object.entries(aninhadas).forEach(([k, v]) => add(mapOferta(v, k, dataArquivo, descartados, ref)));
    }
    for (const loja of ["amazon", "mercadolivre", "mercado_livre", "shopee"]) {
      const v = pick(item, loja, `link_${loja}`, `${loja}_url`, `url_${loja}`, `${loja}Url`);
      if (v) add(mapOferta(v, loja, dataArquivo, descartados, ref));
    }
    // Formato "uma linha por loja".
    if (pick(item, "plataforma", "loja", "store", "marketplace")) {
      add(mapOferta(item, undefined, dataArquivo, descartados, ref));
    }
    porId.set(id, atual);
  });

  // Uma oferta por loja: mantém a verificada mais recente.
  const produtos = [...porId.values()].map((p) => {
    const porLoja = new Map();
    p.ofertas.forEach((o) => {
      const prev = porLoja.get(o.loja);
      if (!prev || (o.linkVerificado && !prev.linkVerificado)) porLoja.set(o.loja, o);
    });
    return { ...p, ofertas: [...porLoja.values()] };
  });
  return { produtos, descartados, ignorados };
};

/**
 * Mescla produtos importados no catálogo existente.
 * Preserva descrição/pontos editados à mão; atualiza ofertas por loja.
 */
export const mesclarCatalogo = (catalogo, importados, agoraISO = new Date().toISOString()) => {
  const produtos = [...(catalogo.produtos || [])];
  const idx = new Map(produtos.map((p, i) => [p.id, i]));
  const novos = [];
  const atualizados = [];
  importados.forEach((imp) => {
    if (!idx.has(imp.id)) {
      produtos.push({ ...imp, atualizadoEm: agoraISO });
      idx.set(imp.id, produtos.length - 1);
      novos.push(imp.id);
      return;
    }
    const atual = produtos[idx.get(imp.id)];
    const ofertas = new Map(atual.ofertas.map((o) => [o.loja, o]));
    imp.ofertas.forEach((o) => {
      const prev = ofertas.get(o.loja);
      // Não rebaixa um link verificado para um não verificado igual.
      if (prev && prev.linkVerificado && !o.linkVerificado && prev.url === o.url) return;
      ofertas.set(o.loja, o);
    });
    produtos[idx.get(imp.id)] = {
      ...imp,
      ...atual,
      prioritario: imp.prioritario || atual.prioritario,
      descricao: atual.descricao || imp.descricao,
      pontosChave: atual.pontosChave || imp.pontosChave,
      ...((atual.tipo || imp.tipo) ? { tipo: atual.tipo || imp.tipo } : {}),
      ...((atual.destaques || imp.destaques) ? { destaques: atual.destaques || imp.destaques } : {}),
      ofertas: [...ofertas.values()],
      atualizadoEm: agoraISO,
    };
    atualizados.push(imp.id);
  });
  return { catalogo: { ...catalogo, versao: 1, atualizadoEm: agoraISO, produtos }, novos, atualizados };
};
