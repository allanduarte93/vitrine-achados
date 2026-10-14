#!/usr/bin/env node
/**
 * Servidor local (sem dependências): serve dist/ e recebe cliques em POST /api/clique.
 *   node src/server.mjs [--porta 8080] [--dist dist]
 * Também serve como base para hospedar em qualquer VPS/Node. Em hospedagem estática,
 * aponte config.endpointCliques para um endpoint equivalente.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizarClique, gravarClique } from "./lib/cliques.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const PORTA = Number(arg("--porta", process.env.PORT || 8080));
const DIST = resolve(RAIZ, arg("--dist", "dist"));
const ARQ_CLIQUES = resolve(RAIZ, "data/cliques.jsonl");
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

const produtosPublicados = () => {
  try {
    const cat = JSON.parse(readFileSync(join(RAIZ, "data/catalogo.json"), "utf8"));
    return new Set(cat.produtos.map((p) => p.id));
  } catch {
    return null;
  }
};

export const criarServidor = ({ dist = DIST, arquivoCliques = ARQ_CLIQUES, produtos = produtosPublicados() } = {}) =>
  createServer((req, res) => {
    const url = new URL(req.url, "http://local");
    if (req.method === "POST" && url.pathname === "/api/clique") {
      let body = "";
      req.on("data", (c) => {
        body += c;
        if (body.length > 2048) req.destroy();
      });
      req.on("end", () => {
        let dados = null;
        try {
          dados = JSON.parse(body);
        } catch { /* ignora */ }
        const clique = normalizarClique(dados, req.headers["user-agent"], produtos);
        if (clique) gravarClique(arquivoCliques, clique);
        res.writeHead(204).end();
      });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") return res.writeHead(405).end();
    let caminho = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let arquivo = join(dist, caminho);
    if (!arquivo.startsWith(dist)) return res.writeHead(403).end();
    if (existsSync(arquivo) && statSync(arquivo).isDirectory()) {
      // URL canônica sempre com barra final: /produto/x -> /produto/x/
      if (!url.pathname.endsWith("/")) return res.writeHead(301, { Location: `${url.pathname}/` }).end();
      arquivo = join(arquivo, "index.html");
    }
    if (!existsSync(arquivo)) {
      res.writeHead(404, { "Content-Type": TIPOS[".html"] }).end(existsSync(join(dist, "404.html")) ? readFileSync(join(dist, "404.html")) : "404");
      return;
    }
    res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": extname(arquivo) === ".html" ? "no-cache" : "public, max-age=3600" });
    res.end(req.method === "HEAD" ? undefined : readFileSync(arquivo));
  });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  criarServidor().listen(PORTA, "127.0.0.1", () => console.log(`Servindo ${DIST} em http://127.0.0.1:${PORTA} (cliques em ${ARQ_CLIQUES})`));
}
