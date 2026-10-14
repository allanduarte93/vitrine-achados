# Entrada do Cowork

1. Salve a pesquisa do Cowork aqui como `entrada/catalogo.json` (formato em `docs/formato-cowork.schema.json`).
2. Simule sem gravar: `node src/cli/importar.mjs entrada/catalogo.json --simular`
3. Importe: `npm run importar:cowork`, o que grava em `data/catalogo.json` e gera o relatório em `data/relatorios/`.
4. Confira: `npm run validar` e `npm run build`, depois `npm run servir` para ver em http://127.0.0.1:8080.

Links sem `validado` + data entram desligados. Preço sem data de coleta é descartado.
Campos de avaliação, vendas e desconto são descartados.
