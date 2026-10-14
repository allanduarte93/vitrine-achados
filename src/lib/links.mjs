/**
 * Regras estruturais de links de afiliado por loja.
 *
 * Validação offline: confere domínio, protocolo e a marcação de afiliado que é
 * visível na URL. Links encurtados (amzn.to, meli.la, s.shopee.com.br) não mostram
 * a marcação, então dependem da verificação feita fora daqui (Cowork) — por isso o
 * botão só é ativado quando o link é estruturalmente válido E está marcado como
 * verificado no catálogo.
 */

export const LOJAS = {
  amazon: { nome: "Amazon", rotuloBotao: "Ver na Amazon" },
  mercadolivre: { nome: "Mercado Livre", rotuloBotao: "Ver no Mercado Livre" },
  shopee: { nome: "Shopee", rotuloBotao: "Ver na Shopee" },
};

const parse = (url) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const hostIs = (host, ...domains) => domains.some((d) => host === d || host.endsWith(`.${d}`));

/**
 * @param {string} loja  amazon | mercadolivre | shopee
 * @param {string} url
 * @param {{amazonTag?: string|null, mercadoLivreMattTool?: string|null}} afiliados
 * @returns {{ok: boolean, motivo?: string, encurtado?: boolean}}
 */
export const validarLinkAfiliado = (loja, url, afiliados = {}) => {
  if (typeof url !== "string" || url.trim() === "") return { ok: false, motivo: "link ausente" };
  if (/\s/.test(url)) return { ok: false, motivo: "link contém espaços" };
  const u = parse(url);
  if (!u) return { ok: false, motivo: "URL inválida" };
  if (u.protocol !== "https:") return { ok: false, motivo: "link precisa ser https" };
  const host = u.hostname.toLowerCase();

  if (loja === "amazon") {
    if (hostIs(host, "amzn.to")) return { ok: true, encurtado: true };
    if (!hostIs(host, "amazon.com.br")) return { ok: false, motivo: "domínio não é amazon.com.br nem amzn.to" };
    const tag = u.searchParams.get("tag");
    if (!tag) return { ok: false, motivo: "link da Amazon sem tag de afiliado" };
    if (afiliados.amazonTag && tag !== afiliados.amazonTag) {
      return { ok: false, motivo: `tag "${tag}" diferente da configurada "${afiliados.amazonTag}"` };
    }
    return { ok: true };
  }

  if (loja === "mercadolivre") {
    if (hostIs(host, "meli.la")) return { ok: true, encurtado: true };
    // Links do programa de afiliados no formato mercadolivre.com/sec/<código>.
    if (hostIs(host, "mercadolivre.com") && u.pathname.startsWith("/sec/")) return { ok: true, encurtado: true };
    if (!hostIs(host, "mercadolivre.com.br")) return { ok: false, motivo: "domínio não é do Mercado Livre" };
    const matt = u.searchParams.get("matt_tool");
    if (!matt) return { ok: false, motivo: "link do Mercado Livre sem matt_tool de afiliado" };
    if (afiliados.mercadoLivreMattTool && matt !== afiliados.mercadoLivreMattTool) {
      return { ok: false, motivo: `matt_tool "${matt}" diferente do configurado` };
    }
    return { ok: true };
  }

  if (loja === "shopee") {
    if (hostIs(host, "s.shopee.com.br", "shope.ee")) return { ok: true, encurtado: true };
    if (!hostIs(host, "shopee.com.br")) return { ok: false, motivo: "domínio não é da Shopee" };
    // Links longos só valem com a marcação do programa de afiliados (utm_source=an_...).
    const utm = u.searchParams.get("utm_source") || "";
    if (!utm.startsWith("an_")) return { ok: false, motivo: "link da Shopee sem marcação de afiliado (use o link curto s.shopee.com.br)" };
    return { ok: true };
  }

  return { ok: false, motivo: `loja desconhecida: ${loja}` };
};

/** Normaliza nomes de loja vindos de pesquisas (ex.: "Mercado Livre", "ML", "amazon.com.br"). */
export const normalizarLoja = (valor, url = "") => {
  const v = String(valor || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/amazon|amzn/.test(v)) return "amazon";
  if (/mercado|^ml$|meli/.test(v)) return "mercadolivre";
  if (/shopee/.test(v)) return "shopee";
  const u = parse(url);
  if (u) {
    const h = u.hostname.toLowerCase();
    if (/amazon|amzn/.test(h)) return "amazon";
    if (/mercadoli|meli/.test(h)) return "mercadolivre";
    if (/shopee|shope\.ee/.test(h)) return "shopee";
  }
  return null;
};
