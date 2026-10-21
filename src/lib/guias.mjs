/**
 * Portão de qualidade dos guias editoriais (data/guias.json).
 *
 * Um guia só é publicado se:
 * - estiver com status "aprovado";
 * - todos os produtos citados estiverem publicados;
 * - tiver conteúdo próprio suficiente (introdução, seções, tamanho mínimo);
 * - não repetir outro guia ou descrição de produto (similaridade por trechos);
 * - não fizer alegações proibidas (teste pessoal, preço, desconto, nota, "melhor do Brasil" etc.);
 * - citar a origem dos fatos (fontes oficiais ou anúncios conferidos) e ter data de atualização.
 */

const PROIBIDAS = [
  [/\b(testamos|testei|testado por nós|nosso teste|experimentamos|usamos (por|durante)|na nossa experiência|em nossos testes)\b/i, "alegação de teste pessoal"],
  [/\b(menor preço|melhor preço|mais barato|desconto|promoção|cupom|frete grátis|oferta imperdível|só hoje)\b/i, "preço/promoção sem fonte"],
  [/\b(\d([.,]\d)?\s*estrelas?|nota \d|avaliações? de clientes|mais vendido)\b/i, "avaliação/nota/vendas sem fonte"],
  [/\b(o melhor do (brasil|mercado)|garantido|100% eficaz|cura)\b/i, "superlativo ou promessa absoluta"],
];

const texto = (g) =>
  [g.introducao, ...(g.secoes || []).flatMap((s) => [s.titulo, ...(s.paragrafos || []), ...(s.lista || [])]), ...(g.perguntas || []).flatMap((q) => [q.pergunta, q.resposta])]
    .filter(Boolean)
    .join(" ");

export const contarPalavras = (s) => (String(s).match(/[\p{L}\p{N}]+/gu) || []).length;

const shingles = (s, n = 5) => {
  const w = (String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]+/g) || []);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(" "));
  return set;
};

export const similaridade = (a, b) => {
  const A = shingles(a);
  const B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / Math.min(A.size, B.size);
};

export const alegacoesProibidas = (s) => PROIBIDAS.filter(([re]) => re.test(s)).map(([, motivo]) => motivo);

const isDate = (s) => typeof s === "string" && !Number.isNaN(Date.parse(s));

/**
 * @param {object[]} guias
 * @param {{publicados:Set<string>, descricoes:string[], agora?:Date, maxDiasSemRevisao?:number}} ctx
 * @returns {{aprovados:object[], rejeitados:{slug:string, motivos:string[]}[], avisos:string[]}}
 */
export const avaliarGuias = (guias, { publicados, descricoes = [], agora = new Date(), maxDiasSemRevisao = 180 }) => {
  const aprovados = [];
  const rejeitados = [];
  const avisos = [];
  const slugs = new Set();
  guias.forEach((g, i) => {
    const motivos = [];
    const ref = g.slug || `guia[${i}]`;
    if ((g.status || "rascunho") !== "aprovado") motivos.push(`status "${g.status || "rascunho"}" (só "aprovado" é publicado)`);
    if (!g.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) motivos.push("slug ausente ou inválido");
    if (slugs.has(g.slug)) motivos.push("slug duplicado");
    slugs.add(g.slug);
    if (!g.titulo || g.titulo.length > 90) motivos.push("título ausente ou com mais de 90 caracteres");
    if (!g.resumo || g.resumo.length < 80 || g.resumo.length > 180) motivos.push("resumo deve ter entre 80 e 180 caracteres");
    if (!g.introducao || g.introducao.length < 200) motivos.push("introdução com menos de 200 caracteres");
    if (!Array.isArray(g.secoes) || g.secoes.length < 2) motivos.push("menos de 2 seções");
    const corpo = texto(g);
    const palavras = contarPalavras(corpo);
    if (palavras < 350) motivos.push(`conteúdo curto (${palavras} palavras; mínimo 350)`);
    if (!Array.isArray(g.produtos) || !g.produtos.length) motivos.push("nenhum produto citado");
    else {
      const fora = g.produtos.filter((id) => !publicados.has(id));
      if (fora.length) motivos.push(`produtos não publicados: ${fora.join(", ")}`);
    }
    if (!isDate(g.atualizadoEm)) motivos.push("sem data de atualização");
    if (!g.fonteFatos && !(Array.isArray(g.fontes) && g.fontes.length)) motivos.push("sem origem dos fatos (fonteFatos ou fontes)");
    (Array.isArray(g.fontes) ? g.fontes : []).forEach((f) => {
      if (!/^https:\/\//.test(f.url || "")) motivos.push(`fonte sem URL https: ${f.titulo || "?"}`);
    });
    const proibidas = alegacoesProibidas(corpo + " " + (g.titulo || "") + " " + (g.resumo || ""));
    if (proibidas.length) motivos.push(`alegações proibidas: ${[...new Set(proibidas)].join(", ")}`);
    // Repetição: contra guias já aprovados e contra descrições de produto.
    const sim = Math.max(0, ...aprovados.map((a) => similaridade(corpo, texto(a))), ...descricoes.map((d) => similaridade(corpo, d)));
    if (sim > 0.35) motivos.push(`texto repetitivo (sobreposição ${(sim * 100).toFixed(0)}% com outro conteúdo)`);
    if (isDate(g.atualizadoEm) && (agora - new Date(g.atualizadoEm)) / 864e5 > maxDiasSemRevisao) {
      avisos.push(`${ref}: sem revisão há mais de ${maxDiasSemRevisao} dias`);
    }
    if (motivos.length) rejeitados.push({ slug: ref, motivos });
    else aprovados.push(g);
  });
  return { aprovados, rejeitados, avisos };
};

/** Perguntas frequentes de produto: curtas, factuais e sem alegações proibidas. */
export const validarPerguntas = (perguntas, ref) => {
  const erros = [];
  if (perguntas == null) return erros;
  if (!Array.isArray(perguntas) || perguntas.length > 6) return [`${ref}: 'perguntas' deve ser uma lista com até 6 itens`];
  perguntas.forEach((q, i) => {
    if (!q || typeof q.pergunta !== "string" || q.pergunta.length < 10 || q.pergunta.length > 140) erros.push(`${ref}.perguntas[${i}]: pergunta entre 10 e 140 caracteres`);
    if (!q || typeof q.resposta !== "string" || q.resposta.length < 20 || q.resposta.length > 700) erros.push(`${ref}.perguntas[${i}]: resposta entre 20 e 700 caracteres`);
    const p = alegacoesProibidas(`${q?.pergunta || ""} ${q?.resposta || ""}`);
    if (p.length) erros.push(`${ref}.perguntas[${i}]: alegações proibidas (${p.join(", ")})`);
  });
  return erros;
};
