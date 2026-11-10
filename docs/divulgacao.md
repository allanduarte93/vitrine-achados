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

### 09/11/2026 — Etapa 1 (autorizada pelo titular)

- Sitemap: teste ao vivo na Inspeção de URL do Search Console → "O URL está disponível para o Google"
  (Googlebot busca o sitemap.xml). Os arquivos estão válidos (98 URLs, todas 200). Nenhum sitemap foi
  removido nem reenviado; o status "Não foi possível buscar" fica em observação.
- Publicado (commit bd447cc, workflow Publicar OK, conferido 3 vezes no site público):
  - Guia Fire TV: título "Fire TV Stick HD vale a pena? Para que serve e o que saber", nova descrição,
    pergunta "Para que serve", seção "Antes de comprar na Black Friday" e ligação com o guia Echo Dot x Fire TV.
  - Guias de secador, whey/creatina e parafusadeira: título de busca com Black Friday e seção do que
    conferir no anúncio (sem preço, desconto ou avaliação).
  - Caixa "Onde comprar" logo após a introdução de todos os guias, com as mesmas URLs de afiliado e o aviso.
- Links de afiliado: catálogo inalterado; 827 links no build conferidos (Amazon só vitrineachados-20, nenhum ID do contratipo).

### 09/11/2026 — Etapa 2

- Publicado (autorizado): guia "Galaxy A17 4G vale a pena em 2026?" (/guias/galaxy-a17-4g-vale-a-pena/),
  37 testes OK, workflow Publicar OK, conferido 3 vezes no site (página, lista de guias, home e sitemap).
  Link de afiliado único e inalterado: https://meli.la/13qLjsv.
- Preparado sem publicar: guia "PS5 Slim Digital vale a pena em 2026?" no branch etapa-3-ps5
  (fontes: playstation.com/pt-br/ps5, rockstargames.com/VI, ficha do anúncio MLB57081243).
- 09/11 — Publicado (autorizado): guia "PS5 Slim Digital vale a pena em 2026?" (/guias/ps5-slim-digital-vale-a-pena/).
  Conferido nas fontes oficiais antes: GTA VI em 19/11/2026 para PS5 (rockstargames.com/VI); Edição Digital
  825 GB e leitor avulso para os grupos CFI-2000 e CFI-2100 (playstation.com/pt-br/ps5); aviso oficial de jogos
  novos só em formato digital a partir de janeiro de 2028 (mesma página). Removido o código CFI-2014B citado
  no anúncio (associado a 1 TB em outras fontes, conflita com os 825 GB da ficha). 37 testes OK, 13 guias
  aprovados no portão de qualidade, site conferido 3 vezes. Link de afiliado inalterado: https://meli.la/27v3uS6.

### 10/11/2026 — Missão "primeira venda" (diagnóstico e preparação)

- ML afiliados (3–9/11): 6 cliques, 0 compradores, 0 pedidos, R$ 0.
- Search Console (02–08/11): 32 impressões, 0 cliques, posição média 7,9 (Fire TV 20, home 10, guia Black Friday 2).
- Top 5 por potencial (painel de afiliados do ML, valores de hoje, só leitura):
  OneBlade QP1425 R$ 134,40 (ganhos 16%), Taiff Black Ion R$ 229,89 (16%), Basic Whey Growth R$ 69,90 (16%),
  Parafusadeira TB-21PX R$ 139,90 (12%), PS5 Slim Digital + 2 jogos R$ 4.277 (12%).
- Rastreamento: links meli.la e tag vitrineachados-20 intactos; verificador automático não gera cliques
  (remove a tag e usa /p/MLB); IndexNow enviado no último deploy (100 URLs, HTTP 200). Site não tem contador de visitas.
- Canais: nenhuma publicação externa feita. Facebook salvo no Chrome é de outra pessoa (não usado), Reddit bloqueado
  para a ferramenta, X e Pinterest são de outros projetos, LinkedIn já usado (regra de não repetir).
- Preparado: docs/posts-prontos.md (5 textos sem preço, com aviso de afiliado).
