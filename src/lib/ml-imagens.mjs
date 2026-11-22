/**
 * Foto oficial do catálogo do Mercado Livre (API pública de produtos).
 * Guarda só a URL do CDN http2.mlstatic.com — o mesmo endereço das fotos que já
 * vêm da Central de Afiliados. Não baixa nem rehospeda o arquivo.
 */

export const FONTE_ML = "API pública de catálogo do Mercado Livre (imagem oficial em http2.mlstatic.com, a mesma CDN das fotos da Central de Afiliados; hotlink, sem rehospedar)";

export const urlImagemCatalogoMl = (json) => {
  const lista = Array.isArray(json?.pictures) ? json.pictures : [];
  const pic = lista.find((p) => p?.secure_url || p?.url);
  const url = pic?.secure_url || pic?.url;
  if (typeof url !== "string" || !url.startsWith("https://")) return null;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host.endsWith("mlstatic.com")) return null;
  return url;
};

/**
 * @returns {Promise<{url?: string, status: number, erro?: string}>}
 */
export const buscarImagemCatalogoMl = async (idProduto, { fetchImpl = fetch, token = "" } = {}) => {
  const id = String(idProduto || "").toUpperCase().replace(/^MLB-?/, "MLB");
  if (!/^MLB\d+$/.test(id)) return { status: 0, erro: "identificador de catálogo inválido" };
  const headers = { accept: "application/json", "user-agent": "VitrineAchados/fotos-catalogo" };
  if (token) headers.authorization = `Bearer ${token}`;
  let r;
  try {
    r = await fetchImpl(`https://api.mercadolibre.com/products/${id}`, { headers, signal: AbortSignal.timeout(15000) });
  } catch (e) {
    return { status: 0, erro: e.name || "falha de rede" };
  }
  if (!r.ok) return { status: r.status, erro: `HTTP ${r.status}` };
  const json = await r.json();
  const url = urlImagemCatalogoMl(json);
  if (!url) return { status: r.status, erro: "resposta sem foto oficial no CDN mlstatic" };
  return { status: r.status, url };
};
