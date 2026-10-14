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
| `siteUrl` | URL final, usada em canonical e sitemap. Hoje: `https://exemplo.invalid` |
| `afiliados.amazonTag` | Tag de Associado. Os links da Amazon com tag diferente são recusados |
| `afiliados.mercadoLivreMattTool` | Opcional, confere `matt_tool` nos links longos |
| `precoValidadeHoras` | Idade máxima do preço exibido |
| `endpointCliques` | Para onde o navegador envia cliques. `/api/clique` funciona com `npm run servir`; em hospedagem estática, aponte para um endpoint equivalente, ou deixe vazio para desligar |

## Testes

`npm test`: 13 testes cobrindo regras de links, ativação de botões, preços, importação, cliques, build (HTML sem JS, sitemap, dados estruturados, subcaminho do GitHub Pages) e servidor.

## Entrada do Cowork

Coloque a pesquisa em `entrada/catalogo.json` e rode `npm run importar:cowork`. O esquema do formato está em `docs/formato-cowork.schema.json`, e o passo a passo em `entrada/LEIA-ME.md`.

## Publicação gratuita (GitHub Pages), só com autorização

O workflow `.github/workflows/publicar.yml` **só roda manualmente** e exige digitar `PUBLICAR`. Ele roda os testes e o `npm run pronto`, que bloqueia se faltar URL, tag da Amazon ou produtos verificados. Depois faz o build e publica.

1. No repositório: **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**:
   - `AMAZON_TAG` (obrigatório);
   - `SITE_URL` (opcional; o padrão é `https://<usuario>.github.io/<repositorio>`).
3. **Actions → Publicar → Run workflow**, digitando `PUBLICAR`.

Observações:
- O GitHub Pages gratuito exige **repositório público**. Em repositório privado é preciso um plano pago.
- No GitHub Pages não há servidor, então o registro de cliques fica desligado (`ENDPOINT_CLIQUES` vazio) até existir um endpoint. Com `npm run servir` em qualquer hospedagem Node, ele funciona.
- Em subcaminho (`usuario.github.io/repositorio`), o `robots.txt` não fica na raiz do domínio. Envie o `sitemap.xml` direto no Google Search Console e no Bing Webmaster.
- Antes de publicar, cadastre a URL do site como canal no Amazon Associados e nos programas de afiliados do Mercado Livre e da Shopee.

`.github/workflows/testes.yml` roda os testes em todo push, sem publicar nada.
