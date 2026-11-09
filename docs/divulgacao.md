# Registro de divulgação — Vitrine Achados

Só entra aqui o que foi efetivamente feito, com data e resultado medido.

## 21/10/2026

| Hora (BRT) | Canal | Ação | Resultado medido |
|---|---|---|---|
| ~18h | Google Search Console | Inspeção: página inicial, /guias/ e guia do Fire TV Stick **indexados** ("O URL está no Google") | 0 cliques, 0 impressões até agora |
| ~18h | Site | 10 produtos do Mercado Livre ganharam descrição e características tiradas do anúncio oficial; passaram a ser indexáveis (sitemap: 25 → 35 URLs; páginas indexáveis 25 → 37) | publicado (commit 08373b9) |
| ~18h | Checagem de links | Verificador passa a abrir /p/MLB… em vez do meli.la (não gera clique de afiliado) | evita cliques falsos no relatório do ML |
| ~18h30 | Google Search Console | Sitemap reenviado; indexação solicitada: produto ventilador Mondial e loção CeraVe (fila prioritária) | aguardando rastreamento |
| automático | IndexNow (Bing, Yandex, Seznam…) | job "avisar-buscadores" do Publicar envia as URLs do sitemap | sem dado de visitas (não há painel Bing configurado) |

### Relatórios dos programas (sem misturar contratipo.app)

- **Amazon, só vitrineachados-20, 21/09–20/10:** 44 cliques, 0 pedidos, R$ 0,00 (parte dos cliques foi do verificador automático antes de 21/10).
- **Mercado Livre, etiqueta ad20260429184559, 14–20/10:** 3 cliques, 0 compradores, 0 pedidos, R$ 0,00.
- **Shopee:** não publicada (aguardando aprovação do site).

### Bloqueios

- Canais com público (redes sociais, grupos, comunidades de ofertas) exigem publicar a partir de
  uma conta: as regras da missão proíbem criar contas novas e publicações manuais do usuário, e
  publicar em nome do titular exige autorização expressa por canal.
- Comunidades de ofertas brasileiras (ex.: Pelando, Promobit) exigem conta própria e têm regras
  sobre links de afiliado: não foram usadas.
- Acesso do Claude ao Search Console foi bloqueado pelo navegador no meio da sessão (permissão de
  site); as demais páginas de produto ficam para o próximo pedido de indexação.

## 04/11/2026

| Canal | Ação | Resultado medido |
|---|---|---|
| Site | +50 produtos ML verificados (70 no total, 59 com foto oficial); categoria Moda e Acessórios; home enxuta (12 destaques + 6 recomendações) | publicado (c09fece, ef6e1c0) |
| Site (SEO) | Guias novos: Black Friday 2026 por perfil, Parafusadeira 12 V ou 21 V, Escova secadora ou secador; introduções em 6 categorias | publicado (35dcc24); sitemap com 96 URLs |
| Google Search Console | `feed.xml` enviado como 2º sitemap; indexação solicitada para o guia de Black Friday | sitemaps seguem "Não foi possível buscar"; 5 páginas indexadas |
| Pinterest | 6 artes originais prontas (`docs/pinterest/`) | não publicado: não há conta da Vitrine Achados |

Medição antes das ações de 04/11 (para comparar depois):
- **Google, últimos 28 dias até 02/11:** 43 impressões, 0 cliques, posição média 8,5; consultas:
  "vitrine dos achados" (6), "pode fere stck" (1). 5 páginas indexadas, 0 com erro.
- **Mercado Livre, 28/10–03/11:** 0 cliques, 0 compradores, 0 pedidos, R$ 0.
- **Amazon (vitrineachados-20):** 0 pedidos, R$ 0.

### 04/11/2026 (fim do dia)

- Pergunta ao ML sobre fotos no Pinterest enviada (caso 490066167).
- Canal externo: nenhum ativado (não há conta própria da Vitrine Achados em rede social; as
  comunidades de promoção verificadas proíbem link de afiliado).
- Search Console, 28 dias até 02/11: 43 impressões, 0 cliques. Por página: guia do Fire TV Stick
  30 impressões, página inicial 13. Consultas visíveis: "vitrine dos achados" (6), "pode fere stck" (1);
  as demais o Google não exibe (consultas raras/anônimas).
- Sitemap conferido no ar: HTTP 200, application/xml, 98 URLs, XML válido; robots.txt do projeto aponta
  para ele. Nenhum defeito técnico comprovado; o status "Não foi possível buscar" é do lado do Search Console.

### 04/11/2026 (noite) — Fire TV Stick

- Search Console (28 dias): o guia do Fire TV Stick HD teve 30 impressões, posição média 8,7, 0 cliques;
  quase todas as consultas são anônimas no relatório. Concorrentes na busca usam "vale a pena" e
  "o que saber" no título (Olhar Digital, TecMundo).
- Publicado (b518992): título "Novo Fire TV Stick HD vale a pena? O que saber antes de comprar",
  nova descrição (TV sem smart, mensalidade, apps, 4K) e pergunta frequente "vale a pena?".
- Amazon, só vitrineachados-20, 05/10–03/11: 53 cliques (44 no período anterior medido, que incluía
  cliques do verificador automático até 21/10), 0 pedidos, R$ 0,00. A origem dos cliques não é
  identificável no relatório.
- Mercado Livre, 28/10–03/11: 0 cliques, 0 pedidos, R$ 0.
- Metadados do repositório no GitHub (link do site) não puderam ser alterados: o proxy desta sessão
  bloqueia alterações de configuração do repositório.

### 04/11/2026 — primeira divulgação externa

- **LinkedIn (perfil pessoal Allan Duarte, público "Qualquer pessoa"):** 1 post com o checklist de
  compra da Black Friday e o link do guia
  https://allanduarte93.github.io/vitrine-achados/guias/black-friday-2026-presentes-por-perfil/ ,
  com aviso de links de afiliado. Link do post:
  https://www.linkedin.com/feed/update/urn:li:activity:7523879457619714049/
  Alcance esperado baixo: o perfil tem 0 conexões. Sem foto de produto (só a prévia do site).
- Canais verificados e não usados: X (@workflowOS1, outro projeto), Instagram/Pinterest de outros
  projetos ou da Ana, Threads (sem login), Facebook e Reddit (bloqueados pela extensão do navegador),
  YouTube (só vídeo).

### 04/11/2026 — prospecção de parceiros

- E-mail enviado (Gmail do titular, já usado nos contatos da Vitrine Achados) para o Vida em Casa
  (info@casadeviver.com.br), site de dicas para a casa que declara aceitar guest posts: proposta de
  artigo original e gratuito sobre organização da cozinha, com link para o guia do site e aviso de
  afiliados. Sem oferta de pagamento ou comissão. Aguardando resposta.
- Outros alvos pesquisados (influenciadores de beleza, newsletters, blogs de DIY) só aceitam
  publicidade paga ou não têm canal comercial público verificável: não foram contatados.
- 04/11 (2ª rodada): proposta de artigo gratuito enviada à Revista 2K (seção Casa,
  guestpostmkt@gmail.com, página "Aceitamos Guest Posts"), com aviso de afiliados e oferta de seguir
  a regra deles sobre links. Avaliados e descartados: Technoeasy (público de pequenas empresas),
  RHB Informática (proíbe conteúdo promocional), Paisagismo BR (pauta de negócios), Soluções
  Industriais (B2B), Convidar.net (cobra para retirar anúncios). Sem respostas até agora.
- 04/11 (3ª rodada): nenhum envio. Avaliados e descartados: Olhar em Foco (jornalismo social da Unesp,
  fora do tema), Revista O Empreiteiro (engenharia), Fazedores (comunidade maker sem contato público),
  Cozinha & Estilo (usa os próprios links de afiliado, concorrente direto); Espaço do Povo, Revista
  Sacada, Blog da Marcenaria e Kalinka Carvalho bloqueiam leitura automática (política não confirmada).
  Respostas de Vida em Casa e Revista 2K: nenhuma.
- 04/11 — Diretórios: **Zearches** aceitou e publicou a listagem (categoria Resources, Tools &
  Directories): https://zearches.com/directory.php?slug=resources-directories . **SoMuch.com**:
  formulário preenchido (categoria Shopping), mas exige reCAPTCHA e verificação por e-mail;
  não enviado. A aba ficou aberta no Chrome com os campos preenchidos.

### 09/11/2026 — medição semanal (comparação com a base de 04/11)

| Fonte | Base 04/11 | 09/11 |
|---|---|---|
| Search Console — impressões (28 dias) | 43 | 62 (até 07/11) |
| Search Console — cliques | 0 | 0 |
| Search Console — posição média | 8,5 | 8,1 |
| Páginas indexadas | 5 | 6 (nenhuma com erro) |
| Mercado Livre afiliados — cliques | 0 (28/10–03/11) | 6 (02–08/11) |
| Mercado Livre — pedidos / ganho | 0 / R$ 0 | 0 / R$ 0 |
| Amazon (só vitrineachados-20) — cliques | 53 (05/10–03/11) | 53 (10/10–08/11) |
| Amazon (só vitrineachados-20) — pedidos / ganho | 0 / R$ 0 | 0 (N.A.) / R$ 0,00 |

- Impressões por página: guia do Fire TV 43, home 18, guia de Black Friday 1.
- Consultas: "vitrine dos achados" 6, "fire tv stick hd para que serve" 1, "pode fere stck" 1.
- Sitemaps (sitemap.xml e feed.xml): continuam com "Não foi possível buscar".
- Amazon medida com filtro só no ID vitrineachados-20 (o total "Tudo" inclui outro projeto e não foi usado).
- Nenhum clique gerado pela medição.
