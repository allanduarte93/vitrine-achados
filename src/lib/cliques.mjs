/**
 * Registro e agregação de cliques (arquivo JSONL, sem dependências).
 * Cada linha: {ts, produto, loja, pagina, origem}. Sem IP nem identificador pessoal.
 */
import { appendFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|curl|wget|python|httpclient/i;
const LOJAS_OK = new Set(["amazon", "mercadolivre", "shopee"]);

/** Valida e normaliza um clique recebido. Retorna null se for inválido ou de robô. */
export const normalizarClique = (body, userAgent = "", produtosValidos = null, agora = new Date()) => {
  if (BOT.test(userAgent || "")) return null;
  if (!body || typeof body !== "object") return null;
  const produto = String(body.produto || "").slice(0, 80);
  const loja = String(body.loja || "");
  if (!/^[a-z0-9-]+$/.test(produto) || !LOJAS_OK.has(loja)) return null;
  if (produtosValidos && !produtosValidos.has(produto)) return null;
  const pagina = String(body.pagina || "").slice(0, 200);
  const origem = String(body.origem || "").replace(/[^a-z0-9.-]/gi, "").slice(0, 100);
  return { ts: agora.toISOString(), produto, loja, pagina: pagina.startsWith("/") ? pagina : "", origem };
};

export const gravarClique = (arquivo, clique) => {
  mkdirSync(dirname(arquivo), { recursive: true });
  appendFileSync(arquivo, JSON.stringify(clique) + "\n");
};

export const lerCliques = (arquivo) => {
  if (!existsSync(arquivo)) return [];
  return readFileSync(arquivo, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

/** Agrega cliques por produto, loja, página e origem dentro de uma janela em dias. */
export const agregar = (cliques, dias = 30, agora = new Date()) => {
  const desde = agora - dias * 864e5;
  const janela = cliques.filter((c) => Date.parse(c.ts) >= desde);
  const contar = (chave) => {
    const m = new Map();
    janela.forEach((c) => m.set(chave(c), (m.get(chave(c)) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  return {
    total: janela.length,
    porProduto: contar((c) => c.produto),
    porLoja: contar((c) => c.loja),
    porProdutoLoja: contar((c) => `${c.produto} · ${c.loja}`),
    porPagina: contar((c) => c.pagina || "(desconhecida)"),
    porOrigem: contar((c) => c.origem || "(direto)"),
  };
};
