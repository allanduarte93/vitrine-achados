/**
 * Registro de fotos por produto (data/imagens.json): url, fonte, identificação e autorização.
 * Uma foto só chega ao site se o registro do próprio produto a autorizar, com a mesma url e
 * identificação compatível com a oferta. Sem isso, o produto fica com a ficha visual (sem foto),
 * nunca com a foto de outro item.
 */
const idOferta = (o) => String(o.identificador || "").toUpperCase().replace(/^MLB-?/, "MLB");

const EXT_IMAGEM = /\.(webp|avif|jpe?g|png|gif)$/i;

/** CDN da Amazon: o acordo não permite gravar a imagem nem guardar o link por mais de 24 horas. */
export const ehCdnAmazon = (url) => {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith("media-amazon.com") || h.endsWith("ssl-images-amazon.com") || h.endsWith("images-amazon.com");
  } catch {
    return false;
  }
};

/**
 * Foto que pode ir para uma vitrine, busca ou lista: uso autorizado, fonte declarada
 * e URL https (ou arquivo próprio em /assets/) que seja de fato uma imagem.
 * Link do CDN da Amazon só vale quando veio da Creators API nesta execução
 * (não de um endereço gravado no repositório).
 */
export const imagemValida = (p, { permitirCdnAmazon = true } = {}) => {
  if (!p || p.imagemPermitida !== true) return false;
  if (typeof p.imagemFonte !== "string" || !p.imagemFonte.trim()) return false;
  const url = String(p.imagem || "");
  if (url.startsWith("/assets/") && EXT_IMAGEM.test(url.split("?")[0])) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (ehCdnAmazon(url) && !permitirCdnAmazon) return false;
    return EXT_IMAGEM.test(u.pathname) || ehCdnAmazon(url) || u.hostname.endsWith("mlstatic.com");
  } catch {
    return false;
  }
};

export const fotoLiberada = (entrada, config, publicacao) => {
  if (!entrada?.url) return false;
  if (entrada.autorizacao === "autorizada") return true;
  if (entrada.autorizacao === "condicional") {
    // Na publicação, a condição precisa estar cumprida (ex.: site aprovado pela loja).
    return !publicacao || config.afiliados?.programasConfirmados?.[entrada.condicao?.loja] === true;
  }
  return false;
};

export const aplicarRegistroImagens = (catalogo, registro, config, { publicacao = false } = {}) => {
  const avisos = [];
  const itens = registro?.produtos || {};
  const produtos = catalogo.produtos.map((p) => {
    const e = itens[p.id];
    const sem = { ...p, imagem: undefined, imagemPermitida: false, imagemFonte: undefined };
    if (!e) {
      if (p.imagem) avisos.push(`${p.id}: foto sem registro em data/imagens.json — não exibida`);
      return sem;
    }
    const ids = p.ofertas.filter((o) => o.loja === e.loja).map(idOferta).filter(Boolean);
    if (e.url && e.identificacao && ids.length && !ids.includes(String(e.identificacao).toUpperCase())) {
      avisos.push(`${p.id}: foto registrada para ${e.identificacao}, mas a oferta é ${ids.join(", ")} — não exibida`);
      return sem;
    }
    if (p.imagem && e.url && p.imagem !== e.url) {
      avisos.push(`${p.id}: url da foto no catálogo difere do registro — não exibida`);
      return sem;
    }
    if (e.url && ehCdnAmazon(e.url)) {
      avisos.push(`${p.id}: link de imagem da Amazon não fica gravado no repositório — a foto só entra pelo build com a Creators API, e o link dura no máximo 24 horas`);
      return sem;
    }
    if (!fotoLiberada(e, config, publicacao)) return sem;
    return { ...p, imagem: e.url, imagemPermitida: true, imagemFonte: e.fonte };
  });
  return { catalogo: { ...catalogo, produtos }, avisos };
};
