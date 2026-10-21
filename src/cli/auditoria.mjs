#!/usr/bin/env node
/**
 * Auditoria do site publicado: compara o build local (recorte de lojas confirmadas)
 * com o que está no ar e lista problemas. Sai com erro se algo importante falhar.
 */
import { appendFileSync } from "node:fs";
import { build } from "../build.mjs";

const out = [];
const log = (t) => { console.log(t); out.push(t); };
const r = build({ saida: "dist-auditoria" });
const site = String(process.env.SITE_URL || "").replace(/\/+$/, "");
let falhas = 0;

log(`## Auditoria ${new Date().toISOString().slice(0, 10)}`);
log(`- Build local: ${r.paginas} páginas, ${r.indexaveis} indexáveis, ${r.produtosPublicados} produtos, ${r.guias} guias`);
r.guiasRejeitados.forEach((g) => log(`- Guia barrado pelo portão de qualidade: **${g.slug}** — ${g.motivos.join("; ")}`));
r.avisos.filter((a) => /revisão|DESATIVADO/.test(a)).forEach((a) => log(`- Aviso: ${a}`));

if (site) {
  for (const caminho of ["/", "/sitemap.xml", "/feed.xml", "/robots.txt"]) {
    const resp = await fetch(site + caminho).catch(() => null);
    const ok = resp && resp.ok;
    if (!ok) falhas++;
    log(`- ${caminho}: ${ok ? "OK" : `FALHA (${resp ? resp.status : "sem resposta"})`}`);
  }
  const sm = await (await fetch(site + "/sitemap.xml").catch(() => null))?.text?.() || "";
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  let quebradas = 0;
  for (const u of urls) {
    const resp = await fetch(u).catch(() => null);
    if (!resp || !resp.ok) { quebradas++; log(`- URL do sitemap fora do ar: ${u} (${resp ? resp.status : "sem resposta"})`); }
  }
  falhas += quebradas;
  log(`- Sitemap publicado: ${urls.length} URLs, ${quebradas} com erro (build local tem ${r.indexaveis})`);
  if (urls.length !== r.indexaveis) log(`- Atenção: o site no ar está diferente do repositório — rode o workflow Publicar.`);
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join("\n") + "\n");
process.exit(falhas ? 1 : 0);
