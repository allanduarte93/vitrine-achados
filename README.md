# Máquina de afiliados: Vitrine Achados

Site estático de ofertas com links de afiliado **verificados** da Amazon, do Mercado Livre e da Shopee. Projeto independente, com build próprio e sem dependências externas (só Node ≥ 20).

Projeto independente: não importa nada de outro repositório e tem `package.json`, Git e workflows próprios. Para rodar em qualquer pasta, basta `npm test && npm run build`.

## Fluxo

```
Pesquisa do Cowork (JSON)
   └─ npm run importar -- pesquisa.json   → normaliza, valida e mescla em data/catalogo.json
                                            (relatório em data/relatorios/)
   └─ npm run validar                     → erros, botões desativados e checklist de publicação
   └─ npm run build                       → dist/ (HTML pronto, sitemap.xml, robots.txt)
   └─ npm run servir                      → serve dist/ e registra cliques em data/cliques.jsonl
   └─ npm run relatorio                   → produtos/lojas/páginas com mais cliques
```

Para atualizar produtos, basta editar `data/catalogo.json` ou importar uma nova pesquisa e rodar o build. O código não muda.

Pré-visualização com dados fictícios (sai com `noindex` e faixa vermelha): `npm run build:exemplo`, depois `node src/server.mjs --dist dist-exemplo`.

## Regras que o sistema aplica sozinho

| Regra | Onde |
|---|---|
| Botão só aparece com link **estruturalmente válido e verificado com data** | `src/lib/catalogo.mjs` (`estadoOferta`) |
| Amazon: domínio `amazon.com.br` com `tag=` (conferida contra `config.afiliados.amazonTag`) ou `amzn.to` | `src/lib/links.mjs` |
| Mercado Livre: `mercadolivre.com/sec/…`, `meli.la` ou `mercadolivre.com.br` com `matt_tool` | idem |
| Shopee: `s.shopee.com.br`/`shope.ee`, ou link longo com `utm_source=an_…`. Busca sem afiliação é recusada | idem |
| Preço da Amazon **nunca** é exibido (só via API oficial) | `estadoOferta` |
| Preço de ML/Shopee só com data de coleta de até `precoValidadeHoras` (padrão 24h), sempre mostrando a data | `estadoOferta` |
| "Menor preço consultado" só quando `mesmoProdutoConfirmado: true` e há pelo menos 2 preços válidos | `render.mjs` |
| Campos de avaliação, nota, vendas, desconto ou cupom: **erro** no catálogo; descartados na importação | `catalogo.mjs`, `importar.mjs` |
| Máximo de 10 produtos prioritários (destaques da home) | `catalogo.mjs` |
| Produto sem oferta ativa não vira página | `build.mjs` |
| Página sem conteúdo próprio (descrição ≥ 120 caracteres ou ≥ 3 pontos-chave) fica `noindex` e fora do sitemap | `produtoIndexavel` |
| Imagem só com `imagemPermitida: true` (uso autorizado) | `catalogo.mjs` |
| Aviso de afiliado no topo, junto aos botões e no rodapé, incluindo a frase obrigatória da Amazon | `render.mjs` |
| JSON-LD apenas com dados visíveis e verdadeiros: BreadcrumbList, ItemList e Product (só com preço exibido) | `render.mjs` |
| Links de compra com `rel="sponsored nofollow"` e destino visível (sem cloaking) | `render.mjs` |
| Cliques: sem cookies, sem IP; filtra robôs e produtos inexistentes | `src/lib/cliques.mjs` |

## Formato aceito do Cowork

O importador é tolerante. Formato recomendado:

```json
{
  "fonte": "Cowork",
  "dataValidacao": "2026-10-14T12:00:00-03:00",
  "produtos": [
    {
      "nome": "Nome do produto como no anúncio",
      "marca": "Marca",
      "categoria": "Casa e Cozinha",
      "prioridade": 1,
      "descricao": "Resumo factual de 2-3 frases baseado no anúncio.",
      "caracteristicas": ["Fato do anúncio 1", "Fato 2", "Fato 3"],
      "mesmo_produto": true,
      "ofertas": [
        { "plataforma": "Amazon", "link": "https://amzn.to/…", "validado": "sim", "validadoEm": "2026-10-14", "asin": "B0…" },
        { "plataforma": "Mercado Livre", "link": "https://mercadolivre.com/sec/…", "validado": "sim", "preco": "R$ 129,90", "data_preco": "2026-10-14T12:00:00-03:00" },
        { "plataforma": "Shopee", "link": "https://s.shopee.com.br/…", "validado": "sim", "preco": 119.9, "data_preco": "2026-10-14T12:00:00-03:00" }
      ]
    }
  ]
}
```

Também aceita:
- campos em inglês (`name`, `category`, `offers`, `url`, `verified`, `price`);
- links por loja direto no item (`amazon`, `link_shopee`, `mercadolivre_url`);
- uma linha por loja (`produto` + `plataforma` + `link`), que são agrupadas pelo nome.

Sem `validado`/`verified` **e** sem data (do item ou `dataValidacao` do arquivo), o link entra como **não verificado** e o botão fica desligado. Preço sem data de coleta é descartado.

## Configuração (`config.json`)

| Campo | Para quê |
|---|---|
| `siteUrl` | URL pública, usada em canonical e sitemap: `https://allanduarte93.github.io/vitrine-achados` |
| `afiliados.amazonTag` | Tag de Associado. Os links da Amazon com tag diferente são recusados |
| `afiliados.mercadoLivreMattTool` | Opcional, confere `matt_tool` nos links longos |
| `afiliados.programasConfirmados` | `amazon`, `mercadolivre`, `shopee`: marque `true` **só depois que a loja aprovar este site** no programa. Controla a declaração "Como Associado da Amazon…" e as frases de participação; oferta ativa de programa não confirmado bloqueia a publicação |
| `precoValidadeHoras` | Idade máxima do preço exibido |
| `contato` | `email` e/ou `url` exibidos na página de contato (hoje: Issues do repositório) |
| `verificacao` | Códigos de verificação do Google Search Console (`google`) e do Bing (`bing`), inseridos como meta tag |
| `endpointCliques` | Para onde o navegador envia cliques. `/api/clique` funciona com `npm run servir`; em hospedagem estática, aponte para um endpoint equivalente, ou deixe vazio para desligar |

## Testes

`npm test`: 16 testes cobrindo regras de links, ativação de botões, preços, importação, cliques, build (HTML sem JS, sitemap, dados estruturados, subcaminho do GitHub Pages) e servidor.

## Identidade visual

- **Marca:** etiqueta laranja com toldo de vitrine e visto de "conferido" (SVG original em `src/lib/icones.mjs`; arquivos `assets/favicon.svg`, `assets/logo.svg`).
- **Paleta:** azul-noite `#14215a` (confiança), laranja vitrine `#ff5a1f` (marca) e `#c2410c` (botões, contraste 5,2:1), verde conferido `#0f7a4a`. Botões de loja nas cores de cada loja, sempre com o nome da loja escrito.
- **Tipografia:** Plus Jakarta Sans (licença SIL OFL 1.1, em `assets/fonts/OFL.txt`), hospedada no próprio site.
- **Ilustrações e ícones:** SVG originais (vitrine do banner, ícones de categoria e interface). Nenhuma foto genérica se passa por produto.
- **Imagens de produto:** só aparecem com `imagem` + `imagemPermitida: true` no catálogo (caminho `/assets/produtos/arquivo.webp` ou URL autorizada pela loja/fabricante). Sem imagem autorizada, o card usa o ícone da categoria.
- **PNGs de marca** (ícones e `og-image.png`): `node scripts/gerar-imagens.mjs` (precisa de Playwright/Chromium na máquina; os PNGs gerados ficam versionados).
- **Categorias da home:** `config.categoriasVitrine`. Sem produtos, elas aparecem como "Em curadoria" e sem link; com produtos, viram links com contagem.

## Entrada do Cowork

Coloque a pesquisa em `entrada/catalogo.json` e rode `npm run importar:cowork`. O esquema do formato está em `docs/formato-cowork.schema.json`, e o passo a passo em `entrada/LEIA-ME.md`.

## Publicação gratuita (GitHub Pages), só com autorização

Site: **https://allanduarte93.github.io/vitrine-achados/**

O workflow `.github/workflows/publicar.yml` **só roda manualmente** e exige digitar `PUBLICAR`. Ele roda os testes e o `npm run pronto`, depois faz o build e publica.

**Modos (decididos por `npm run pronto`):**
- **Institucional** (catálogo sem ofertas verificadas): publica início, sobre, aviso de afiliados, contato e privacidade. Exige só URL real e contato. Nenhum produto, preço ou botão de compra.
- **Comercial** (há ofertas verificadas): publica também categorias e produtos, mas só com links válidos e verificados. Se houver oferta da Amazon ativa, exige a variável `AMAZON_TAG` no repositório.

**Para publicar:** Actions → Publicar → Run workflow → digite `PUBLICAR`.

Observações:
- O registro de cliques fica desligado no GitHub Pages (sem servidor). A página de privacidade reflete isso automaticamente.
- O `robots.txt` em subcaminho não fica na raiz do domínio. Envie o `sitemap.xml` direto no Google Search Console e no Bing Webmaster (propriedade do tipo prefixo de URL). Os códigos de verificação vão em `config.verificacao`.
- `.github/workflows/testes.yml` roda os testes em todo push, sem publicar.
