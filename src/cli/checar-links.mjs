#!/usr/bin/env node
/**
 * Verifica, pela rede, os links de compra ATIVOS do catálogo.
 *   node src/cli/checar-links.mjs [data/catalogo.json] [--timeout 15000]
 *
 * Para cada oferta ativa: segue os redirecionamentos (até 10) e confere se o destino
 * final é uma página de produto da loja certa — e não busca, home, login ou erro.
 * Confere também o estoque na mesma página (sem link de afiliado): indisponível ou sem compra
 * direta conta como falha; captcha, bloqueio ou página sem sinal claro = "não verificado" (aviso).
 * Sai com código 1 se algum link falhar. Rode antes de cada publicação comercial.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ofertasAtivas, somenteConfirmadas } from "../lib/catalogo.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const caminho = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--timeout") || "data/catalogo.json";
const TIMEOUT = Number(args.includes("--timeout") ? args[args.indexOf("--timeout") + 1] : 15000);
const config = JSON.parse(readFileSync(resolve(RAIZ, "config.json"), "utf8"));
const lido = JSON.parse(readFileSync(resolve(RAIZ, caminho), "utf8"));
const catalogo = process.env.SOMENTE_CONFIRMADOS === "1" ? somenteConfirmadas(lido, config) : lido;

const DOMINIO = { amazon: /(^|\.)amazon\.com\.br$/, mercadolivre: /(^|\.)mercadolivre\.com\.br$/, shopee: /(^|\.)shopee\.com\.br$/ };
// Padrões de página de produto e de destinos ruins, por loja.
export const PRODUTO = {
  amazon: /\/(dp|gp\/product)\/[A-Z0-9]{10}/i,
  mercadolivre: /(\/p\/MLB\d+|MLB-?\d+)/i,
  shopee: /(-i\.\d+\.\d+|\/(product|opaanlp)\/\d+\/\d+)/i,
};
// Página social do programa "Afiliados e Criadores" do ML: o produto vem cifrado em `ref`,
// então a confirmação é pelo identificador MLB no conteúdo da página.
const ML_SOCIAL = /^\/social\/[\w-]+/i;
const RUIM = /\/(s|search|busca|lista)(\/|\?|$)|[?&](k|keyword|q)=|\/(login|signin|ap\/signin|jms\/|account)/i;

export const classificar = (loja, urlFinal, status, { corpo = "", identificador = "" } = {}) => {
  // Lojas costumam barrar robôs de datacenter: isso não prova que o link está quebrado.
  if ([403, 429, 503].includes(status)) return { ok: null, motivo: `inconclusivo: a loja bloqueou a verificação automática (HTTP ${status}); confira abrindo o link` };
  // Erro temporário do servidor/gateway da loja (ex.: 504): não prova link quebrado (isso seria 404/410).
  if ([500, 502, 504].includes(status)) return { ok: null, motivo: `inconclusivo: erro temporário do servidor da loja (HTTP ${status}); confira abrindo o link` };
  if (!status || status >= 400) return { ok: false, motivo: `HTTP ${status || "sem resposta"}` };
  let u;
  try { u = new URL(urlFinal); } catch { return { ok: false, motivo: "URL final inválida" }; }
  if (!DOMINIO[loja]?.test(u.hostname)) return { ok: false, motivo: `destino fora da loja (${u.hostname})` };
  // Página de captcha/robô da Amazon (às vezes com HTTP 200): não prova nada sobre o link.
  if (loja === "amazon" && (/\/errors\/validateCaptcha/i.test(u.pathname) || /validateCaptcha|api-services-support@amazon\.com/i.test(corpo))) {
    return { ok: null, motivo: "inconclusivo: a Amazon pediu captcha à verificação automática; confira abrindo o link" };
  }
  // Parede de captcha/segurança do ML (às vezes HTTP 200): também não prova nada.
  if (loja === "mercadolivre" && (/\/(captcha|gz\/account-verification|security)/i.test(u.pathname) || /Por segurança, complete esta etapa/i.test(corpo))) {
    return { ok: null, motivo: "inconclusivo: o Mercado Livre pediu captcha à verificação automática; confira abrindo o link" };
  }
  if (RUIM.test(u.pathname + u.search) && !PRODUTO[loja].test(u.pathname)) return { ok: false, motivo: "cai em busca/login, não no produto" };
  if (loja === "mercadolivre" && ML_SOCIAL.test(u.pathname)) {
    if (!u.searchParams.get("matt_tool")) return { ok: false, motivo: "página social do ML sem matt_tool (rastreamento perdido)" };
    const id = String(identificador).replace(/^MLB-?/i, "");
    if (id && new RegExp(`MLB-?${id}(?!\\d)`, "i").test(corpo)) return { ok: true };
    return { ok: null, motivo: "inconclusivo: página social de afiliado do ML com matt_tool; produto não confirmado no conteúdo (confira abrindo o link)" };
  }
  if (!PRODUTO[loja].test(u.pathname + u.search)) return { ok: false, motivo: "destino não parece página de produto" };
  return { ok: true };
};

/**
 * Estoque a partir da página do produto (aberta SEM link de afiliado). Nunca conclui "disponível"
 * sem um sinal positivo explícito; captcha, bloqueio ou página sem sinais = "nao-verificado".
 * Estados: disponivel | indisponivel | sem-compra-direta | nao-verificado.
 */
const SINAIS = {
  amazon: {
    bloqueio: /validateCaptcha|api-services-support@amazon\.com|Digite os caracteres que você vê|Type the characters you see/i,
    indisponivel: /id=["']outOfStock["']|N[ãa]o dispon[íi]vel\.|Atualmente indispon[íi]vel|Currently unavailable/i,
    semCompraDireta: /buybox-see-all-buying-choices|Ver todas as op[çc][õo]es de compra/i,
    disponivel: /id=["'](add-to-cart-button|buy-now-button)["']/i,
  },
  mercadolivre: {
    bloqueio: /Por seguran[çc]a, complete esta etapa|gz\/account-verification/i,
    indisponivel: /schema\.org\/(OutOfStock|SoldOut|Discontinued)|Este produto est[áa] indispon[íi]vel|(An[úu]ncio|Publica[çc][ãa]o) pausad[ao]|Sem estoque/i,
    disponivel: /schema\.org\/InStock|>\s*Comprar agora\s*</i,
  },
};
export const avaliarEstoque = (loja, { status = 0, corpo = "" } = {}) => {
  const s = SINAIS[loja];
  if (!s) return { estado: "nao-verificado", sinal: "loja sem regra de estoque" };
  if (status !== 200 || !corpo) return { estado: "nao-verificado", sinal: status ? `HTTP ${status}` : "sem resposta" };
  if (s.bloqueio.test(corpo)) return { estado: "nao-verificado", sinal: "captcha ou bloqueio da loja" };
  const neg = s.indisponivel.test(corpo), pos = s.disponivel.test(corpo);
  if (neg && pos) return { estado: "nao-verificado", sinal: "sinais conflitantes (há botão de compra e aviso de indisponível)" };
  if (neg) return { estado: "indisponivel", sinal: corpo.match(s.indisponivel)[0] };
  if (pos) return { estado: "disponivel", sinal: corpo.match(s.disponivel)[0].replace(/[<>]/g, "").trim() };
  if (s.semCompraDireta?.test(corpo)) return { estado: "sem-compra-direta", sinal: corpo.match(s.semCompraDireta)[0] };
  return { estado: "nao-verificado", sinal: "página sem sinal claro de estoque" };
};

/**
 * URL usada na checagem pela rede. Para a Amazon, abre a página do produto SEM os
 * parâmetros de afiliado (tag, linkCode, linkId, ref_): assim a verificação automática
 * não gera cliques no ID de Associado. A tag continua sendo conferida offline
 * (validarLinkAfiliado). No Mercado Livre, abrir o link curto meli.la conta clique na etiqueta
 * de afiliado; por isso, quando há o código de catálogo (MLB…), a checagem abre a página
 * pública do produto (/p/MLB…), sem etiqueta. Para a Shopee o link curto é o próprio
 * redirecionamento (a loja não está publicada).
 */
export const urlParaChecagem = (loja, url, identificador = "") => {
  if (loja === "mercadolivre") {
    const id = String(identificador || "").toUpperCase().replace(/^MLB-?/, "");
    return /^\d+$/.test(id) ? `https://www.mercadolivre.com.br/p/MLB${id}` : url;
  }
  if (loja !== "amazon") return url;
  try {
    const u = new URL(url);
    ["tag", "linkCode", "linkId", "ref_", "ref", "language", "th", "psc", "camp", "creative", "creativeASIN", "ascsubtag"].forEach((k) => u.searchParams.delete(k));
    u.pathname = u.pathname.replace(/\/ref=[^/]*$/, "");
    return u.toString().replace(/\?$/, "");
  } catch {
    return url;
  }
};

const seguir = async (url) => {
  const cadeia = [];
  let atual = url;
  for (let i = 0; i < 10; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(atual, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (verificador de links Vitrine Achados)", "accept-language": "pt-BR" } });
      cadeia.push(`${r.status} ${atual}`);
      const loc = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && loc) {
        atual = new URL(loc, atual).toString();
        continue;
      }
      const corpo = r.status === 200 ? (await r.text()).slice(0, 2_000_000) : "";
      return { status: r.status, final: atual, cadeia, corpo };
    } catch (e) {
      cadeia.push(`ERRO ${atual}: ${e.cause?.code || e.name}`);
      return { status: 0, final: atual, cadeia };
    } finally {
      clearTimeout(t);
    }
  }
  return { status: 0, final: atual, cadeia: [...cadeia, "redirecionamentos demais"] };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const alvos = catalogo.produtos.flatMap((p) => ofertasAtivas(p, config).map((o) => ({ p, o })));
  if (!alvos.length) {
    console.log("Nenhuma oferta ativa no catálogo: nada a verificar.");
    process.exit(0);
  }
  const linhas = [];
  let falhas = 0;
  let inconclusivos = 0;
  const estoque = { disponivel: 0, indisponivel: 0, "sem-compra-direta": 0, "nao-verificado": 0 };
  for (const { p, o } of alvos) {
    const r = await seguir(urlParaChecagem(o.loja, o.url, o.identificador));
    const c = classificar(o.loja, r.final, r.status, { corpo: r.corpo, identificador: o.identificador });
    // Estoque só é avaliado quando a página do produto abriu de verdade; senão, "não verificado".
    const e = c.ok ? avaliarEstoque(o.loja, r) : { estado: "nao-verificado", sinal: c.motivo || "página não confirmada" };
    estoque[e.estado]++;
    const semEstoque = e.estado === "indisponivel" || e.estado === "sem-compra-direta";
    if (c.ok === false || semEstoque) falhas++;
    else if (c.ok === null || e.estado === "nao-verificado") inconclusivos++;
    linhas.push({ produto: p.id, loja: o.loja, ok: c.ok, motivo: c.motivo || "", estoque: e.estado, sinalEstoque: e.sinal, final: r.final, cadeia: r.cadeia });
    const rotulo = c.ok === false || semEstoque ? "FALHA" : c.ok === null || e.estado === "nao-verificado" ? "AVISO" : "OK   ";
    console.log(`${rotulo} ${p.id} · ${o.loja} → ${c.ok ? `estoque: ${e.estado.replace("nao-verificado", "não verificado")} (${e.sinal})` : c.motivo}`);
    if (semEstoque) console.log(`      ação: confira a página e, se confirmado, registre "disponibilidade": {"estado": "${e.estado}", ...} na oferta (data/catalogo.json)`);
    if (!c.ok) console.log(`      destino: ${r.final}\n      cadeia: ${r.cadeia.join(" → ")}`);
  }
  console.log(`\nEstoque: ${estoque.disponivel} disponível(is) · ${estoque.indisponivel} indisponível(is) · ${estoque["sem-compra-direta"]} sem compra direta · ${estoque["nao-verificado"]} não verificado(s)`);
  mkdirSync(resolve(RAIZ, "data/relatorios"), { recursive: true });
  const rel = resolve(RAIZ, `data/relatorios/links-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
  writeFileSync(rel, JSON.stringify(linhas, null, 2));
  console.log(`\n${alvos.length - falhas - inconclusivos} OK · ${inconclusivos} inconclusivo(s) · ${falhas} falha(s) de ${alvos.length}. Relatório: ${rel}`);
  process.exit(falhas ? 1 : 0);
}
