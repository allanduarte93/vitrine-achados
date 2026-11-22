/**
 * Fotos da Amazon só pela Creators API (hotlink). Não baixa o arquivo e não grava a URL
 * no repositório: o Acordo Operacional permite guardar o link de uma imagem por até 24 horas.
 *
 * Credenciais (só o titular gera, em Associados → Ferramentas → Creators API):
 *   AMAZON_CREATORS_CREDENTIAL_ID
 *   AMAZON_CREATORS_CREDENTIAL_SECRET
 *   AMAZON_CREATORS_VERSION  (3.1 para amazon.com.br; use o número que o painel mostrar)
 */
import { ofertasAtivas } from "./catalogo.mjs";
import { aplicarRegistroImagens, imagemValida } from "./imagens.mjs";

export const FONTE_AMAZON = "Creators API da Amazon (hotlink da imagem oficial, sem rehospedar; o link vale só nesta publicação, no máximo 24 horas)";

/** Endpoints oficiais de token por versão da credencial (Using cURL, Associados BR). */
export const TOKEN_POR_VERSAO = {
  "3.1": "https://api.amazon.com/auth/o2/token",
  "3.2": "https://api.amazon.co.uk/auth/o2/token",
  "3.3": "https://api.amazon.co.jp/auth/o2/token",
};

export const URL_GET_ITEMS = "https://creatorsapi.amazon/catalog/v1/getItems";
const MARKETPLACE = "www.amazon.com.br";

const hostDeImagemAmazon = (url) => {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h.endsWith("media-amazon.com") || h.endsWith("ssl-images-amazon.com") || h.endsWith("images-amazon.com");
  } catch {
    return false;
  }
};

const escolherImagem = (item) => {
  const primaria = item?.images?.primary;
  const tamanho = primaria?.large || primaria?.medium || primaria?.small;
  if (!tamanho?.url || !hostDeImagemAmazon(tamanho.url)) return null;
  const width = Number(tamanho.width);
  const height = Number(tamanho.height);
  return {
    url: tamanho.url,
    ...(Number.isInteger(width) && width > 0 ? { width } : {}),
    ...(Number.isInteger(height) && height > 0 ? { height } : {}),
  };
};

const itensDaResposta = (corpo) => corpo?.itemsResult?.items || corpo?.itemResults?.items || corpo?.items || [];

export const asinsSemFoto = (catalogo, registro, config, { publicacao = false } = {}) => {
  const aplicado = registro ? aplicarRegistroImagens(catalogo, registro, config, { publicacao }).catalogo : catalogo;
  const asins = [];
  for (const p of aplicado.produtos || []) {
    if (imagemValida(p)) continue;
    const oferta = (p.ofertas || []).find((o) => o.loja === "amazon" && o.identificador);
    if (!oferta) continue;
    if (!ofertasAtivas(p, config).some((o) => o.loja === "amazon")) continue;
    asins.push(String(oferta.identificador).toUpperCase());
  }
  return [...new Set(asins)];
};

export const aplicarImagensAmazonNoCatalogo = (catalogo, mapa) => {
  if (!mapa || !Object.keys(mapa).length) return catalogo;
  return {
    ...catalogo,
    produtos: (catalogo.produtos || []).map((p) => {
      if (imagemValida(p)) return p;
      const asin = (p.ofertas || []).find((o) => o.loja === "amazon" && o.identificador)?.identificador;
      const img = asin && mapa[String(asin).toUpperCase()];
      if (!img?.url || !hostDeImagemAmazon(img.url)) return p;
      return {
        ...p,
        imagem: img.url,
        imagemPermitida: true,
        imagemFonte: FONTE_AMAZON,
        ...(img.width ? { imagemLargura: img.width } : {}),
        ...(img.height ? { imagemAltura: img.height } : {}),
        imagemLinkLoja: "amazon",
      };
    }),
  };
};

const pedirToken = async (fetchImpl, tokenUrl, id, secret) => {
  const r = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
      scope: "creatorsapi::default",
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return { erro: `token HTTP ${r.status}` };
  const corpo = await r.json();
  if (!corpo?.access_token) return { erro: "token ausente na resposta" };
  return { token: corpo.access_token };
};

const pedirItens = async (fetchImpl, token, partnerTag, asins) => {
  const r = await fetchImpl(URL_GET_ITEMS, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json",
      "x-marketplace": MARKETPLACE,
    },
    body: JSON.stringify({
      itemIds: asins,
      itemIdType: "ASIN",
      marketplace: MARKETPLACE,
      partnerTag,
      resources: ["images.primary.large", "images.primary.medium"],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return { erro: `GetItems HTTP ${r.status}` };
  return { corpo: await r.json() };
};

/**
 * Busca só a URL da imagem (não o arquivo). Sem credencial, devolve mapa vazio.
 * @returns {Promise<{mapa: Record<string, {url: string, width?: number, height?: number}>, avisos: string[]}>}
 */
export const buscarImagensAmazon = async ({ asins, partnerTag, env = process.env, fetchImpl = fetch } = {}) => {
  const avisos = [];
  const id = env.AMAZON_CREATORS_CREDENTIAL_ID || "";
  const secret = env.AMAZON_CREATORS_CREDENTIAL_SECRET || "";
  if (!id || !secret) {
    return { mapa: {}, avisos: ["Amazon: sem credencial da Creators API; produtos sem foto ficam fora da vitrine"] };
  }
  if (!asins?.length) return { mapa: {}, avisos };
  if (!partnerTag) return { mapa: {}, avisos: ["Amazon: tag de Associado ausente; a Creators API não foi chamada"] };
  const versao = env.AMAZON_CREATORS_VERSION || "3.1";
  const tokenUrl = TOKEN_POR_VERSAO[versao];
  if (!tokenUrl) return { mapa: {}, avisos: [`Amazon: versão de credencial "${versao}" não está na tabela oficial (3.1, 3.2 ou 3.3)`] };

  let token;
  try {
    const t = await pedirToken(fetchImpl, tokenUrl, id, secret);
    if (t.erro) return { mapa: {}, avisos: [`Amazon: não foi possível autenticar na Creators API (${t.erro})`] };
    token = t.token;
  } catch (e) {
    return { mapa: {}, avisos: [`Amazon: falha ao pedir o token da Creators API (${e.name || "erro"})`] };
  }

  const mapa = {};
  for (let i = 0; i < asins.length; i += 10) {
    const lote = asins.slice(i, i + 10);
    try {
      const resp = await pedirItens(fetchImpl, token, partnerTag, lote);
      if (resp.erro) {
        avisos.push(`Amazon: ${resp.erro} para ${lote.join(", ")}`);
        continue;
      }
      for (const item of itensDaResposta(resp.corpo)) {
        const img = escolherImagem(item);
        if (item?.asin && img) mapa[String(item.asin).toUpperCase()] = img;
      }
    } catch (e) {
      avisos.push(`Amazon: falha no GetItems (${e.name || "erro"})`);
    }
  }
  const faltaram = asins.filter((a) => !mapa[a]);
  if (faltaram.length) avisos.push(`Amazon: a Creators API não devolveu imagem para ${faltaram.join(", ")}`);
  return { mapa, avisos };
};
