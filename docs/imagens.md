# Fotos dos produtos — registro de fonte, licença e status

Regra do site: uma foto só aparece se o produto tiver `imagem` + `imagemPermitida: true` +
`imagemFonte` (quem autorizou e quando) e a URL for https de uma imagem (ou arquivo próprio em
`/assets/`). Com isso ela entra na página inicial, nas categorias, na busca e na página do produto.
Sem imagem válida, o produto **não entra** em vitrine, busca, lista nem página: nenhum card é
renderizado sem foto. Nada de foto genérica, inventada ou gerada por IA.

## 22/11/2026 — troca para o Mercado Livre, só com o mesmo modelo e com foto

Os 10 anúncios da Amazon que estavam ativos sem foto ficaram no catálogo com `disponibilidade.estado: "guardada"`. Não é estoque esgotado: a oferta volta quando a Creators API entregar a foto. O botão público passa a ser o do Mercado Livre só quando existe o mesmo modelo, com foto no mesmo padrão dos outros produtos ML (hotlink em `http2.mlstatic.com`, sem rehospedar).

O Cicaplast Baume B5+ de 40 ml já estava no site como catálogo MLB24326256, com foto da Central de Afiliados e link `meli.la/2L8U337`. O guia da CeraVe passa a apontar para esse anúncio. A oferta da Amazon desse item ficou guardada.

Deste ambiente o Mercado Livre pediu login em todas as páginas de catálogo e a API pública respondeu 401, então não deu para copiar a foto oficial dos demais. Ficam fora até o Allan abrir a página, conferir modelo/cor/voltagem e gerar o `meli.la` na conta (etiqueta ad20260429184559, matt_tool 68963796):

| Produto | Página de catálogo encontrada | Por que ficou fora |
|---|---|---|
| Kindle 16 GB verde, 11ª geração, modelo 2024 | https://www.mercadolivre.com.br/p/MLB46676867 | página bloqueou; sem foto oficial conferida |
| Kindle Paperwhite 16 GB preto, 2024, ASIN B0CFPL6CFY | https://www.mercadolivre.com.br/p/MLB44031857 | página bloqueou; sem foto oficial conferida |
| Elseve Óleo Extraordinário 100 ml | https://www.mercadolivre.com.br/p/MLB26080271 | ficha de 100 ml confere; sem foto oficial conferida |
| Galaxy A17 azul 256 GB / 8 GB | https://www.mercadolivre.com.br/p/MLB54982411 | já tem `meli.la/13qLjsv`; falta a foto |
| Echo Dot preto | só apareceu catálogo azul (MLB19795011) | cor diferente; não é o mesmo anúncio |
| Fire TV Stick HD alimentado pela TV (B0DVK166SV) | o anúncio achado é outro ASIN, com fonte na tomada | não é o mesmo modelo |
| Airfryer AI551/09 110/127 V, Cadence Click 127 V, potes Electrolux A23122901, Logitech M170 preto | sem página de catálogo conferida | sem equivalente exato com foto |

## 22/11/2026 — nenhum anúncio sem foto

Conferido no [Acordo Operacional](https://associados.amazon.com.br/help/operating/agreement) (atualizado em 15/10/2025) e nas [Políticas do Programa](https://associados.amazon.com.br/help/operating/policies), licença de PI:

- Imagem de produto da Amazon é Conteúdo de Anúncio obtido pela **Creators API** ou pela API de Divulgação de Produtos (ou feed aprovado por escrito). A licença não inclui mineração, robô ou extração da página do produto.
- É proibido armazenar ou colocar em cache o arquivo da imagem. Pode-se guardar **o link** da imagem por no máximo 24 horas e, em seguida, atualizar com uma nova chamada à API.
- O SiteStripe desta conta, conferido em 20/10/2026, só gera link de texto. A documentação atual do programa também não oferece mais a opção de link de imagem nessa barra. Não há, portanto, link de imagem do SiteStripe para gravar com a tag `vitrineachados-20`.
- Não havia credencial da Creators API no repositório nem no ambiente deste build. O `npm run build` chama a API só se existirem `AMAZON_CREATORS_CREDENTIAL_ID` e `AMAZON_CREATORS_CREDENTIAL_SECRET` (e, se o painel mostrar outro número, `AMAZON_CREATORS_VERSION`; para a amazon.com.br a tabela oficial usa 3.1). A URL volta só no HTML daquela publicação, em hotlink, e a imagem do card aponta para a página do produto na Amazon. O arquivo não é baixado nem copiado para `assets/`.

Mercado Livre: a API pública `GET https://api.mercadolibre.com/products/{MLB}` passou a responder 401 sem token (22/11/2026), e a página do catálogo do Galaxy A17 (`MLB54982411`) pediu verificação de conta a partir deste ambiente. `npm run obter-fotos-ml` grava o hotlink do CDN `http2.mlstatic.com` quando a API devolve a foto. Com `ML_ACCESS_TOKEN` o mesmo comando envia `Authorization: Bearer`. Sem resposta, o produto continua sem foto e sai da vitrine. A Shopee segue desligada.

Fonte de verdade por produto: **`data/imagens.json`**, com url, fonte, identificação (ASIN, MLB ou
loja.item da Shopee), variação, autorização e evidência. O build só mostra a foto quando o registro
do próprio produto a libera, com a mesma url e identificação igual à da oferta. Se algo não bater,
o produto fica com a ficha visual, nunca com a foto de outro item. Uma licença `condicional` (ex.:
Shopee, válida só em Mídia de Afiliado aprovada) aparece na prévia, mas só é publicada quando a
loja da condição estiver confirmada em `config.afiliados.programasConfirmados`.
`npm run checar-fotos` (workflow "Checar links") confere se cada foto liberada responde como
imagem e se pertence ao anúncio.

Situação em 21/10/2026: **9 de 30 fotos liberadas** (Mercado Livre); Amazon e Shopee seguem sem foto.

| Loja | Produtos | Foto real disponível | Autorização | Publicada |
|---|---|---|---|---|
| Amazon | 10 | não | pendente: só pela Creators API (exige 10 vendas em 30 dias) ou por licença do fabricante (pedidos abaixo) | não |
| Shopee | 10 | sim (Portal de Afiliados) | condicional: Termos 2.2 só em Mídia aprovada; aprovação do site pedida em 20/10 | não (Shopee não confirmada) |
| Mercado Livre | 10 | 9 (Central e lista de afiliados) | autorizada por escrito no caso 490066167 (21/10): imagens das ferramentas oficiais; registro `condicional` ao ML ativo | 9 (publicação de 21/10) |

Variações a observar na Shopee: jogo de chaves (40 ou 46 peças no mesmo anúncio), power bank
(Tipo-C ou Lightning), árvore de Natal (tamanhos diferentes no anúncio) e conjunto fitness
(cor/tamanho). O link abre o anúncio, não uma variação, então a foto principal pode mostrar outra
versão. Isso está registrado em `variacao`.

### Amazon (detalhe dos pedidos)

Pedidos de licença enviados em 21/10/2026 (e-mail do titular, allan.duarte93@gmail.com), todos
pedindo autorização gratuita e por escrito e arquivos oficiais ou acesso a banco de imagens.
Destinatários conferidos nas páginas oficiais antes do envio. Os e-mails não geram protocolo;
o comprovante é a mensagem enviada no Gmail do titular (ids abaixo).

| Produto | ASIN | Fonte possível da foto | Autorização / licença | Status |
|---|---|---|---|---|
| Echo Dot (mais recente), preto | B09B8VGCR8 | Amazon (Creators API) | API exige 10 vendas qualificadas em 30 dias; políticas proíbem copiar/hospedar fotos. Consulta ao Suporte ao Associado enviada 20/10 (resposta vai ao e-mail principal da conta de Associado) | Bloqueado |
| Fire TV Stick HD (mais recente) | B0DVK166SV | Amazon (Creators API) | Idem | Bloqueado |
| CeraVe Loção Hidratante 473 ml | B07RK4HST7 | L'Oréal Brasil — imprensa: lorealgroupebr@loreal.com (loreal.com/pt-br/brazil) | Termos do site: só uso pessoal e privado. **Pedido ENVIADO 21/10/2026** (Gmail, id 1a15f74f1c068299) | Aguardando resposta |
| La Roche-Posay Cicaplast Baume B5+ 40 ml | B072MK7BN2 | L'Oréal Brasil (mesmo e-mail) | Idem (mesmo pedido enviado) | Aguardando resposta |
| L'Oréal Paris Elseve Óleo Extraordinário 100 ml | B07H113TPQ | L'Oréal Brasil (mesmo e-mail) | Idem (mesmo pedido) | Bloqueado |
| Sanduicheira Cadence Click 127 V | B0CDJ4L7CZ | Cadence (Newell Brands Brasil) — só SAC: cadence.com.br/apoio-ao-consumidor/formulario/atendimento | Sem banco de imagens nem termos. **Não enviado:** o formulário exige CPF, endereço e celular e só tem assuntos de garantia/peças/compra/entrega. Envio pelo titular via WhatsApp (47) 99117-2660 ou 0800 644 6442, com o texto abaixo | Bloqueado |
| Electrolux kit 12 potes A23122901 | B09XJL4B9H | Electrolux Brasil — imprensa: imprensa.electrolux@inpresspni.com.br (electroluxgroup.com, contatos Brasil) | Banco de imagens sem termos de uso. **Pedido ENVIADO 21/10/2026** a imprensa.electrolux@inpresspni.com.br, cópia sarah.trench@electrolux.com (Brand Communications Manager) (Gmail, id 1a15f74f261167e2) | Aguardando resposta |
| Bravecto 250 mg (4,5–10 kg) | B07J4J9XKZ | MSD Saúde Animal — só "Fale Conosco": msd-saude-animal.com.br/fale-conosco-2 (assunto "Outros") | Sem material oficial. **Não enviado:** o formulário exige aceitar receber comunicações de marketing por qualquer canal e mensagens por WhatsApp; nenhuma "profissão" se aplica. Decisão do titular (formulário em msd-saude-animal.com.br/fale-conosco-2, ou 0800 7070 512) | Bloqueado |
| Omo Lavagem Perfeita 5 L | B07DYHDXX8 | Unilever Brasil — imprensa: unilever.corp@inpresspni.com.br | Termos: só uso não comercial. **Pedido ENVIADO 21/10/2026** (Gmail, id 1a15f74f9a7e53b8) | Aguardando resposta |
| Logitech M170 | B074L9L5KZ | Logitech — mediarelations@logitech.com | Logitech Assets License veta anúncio em marketplaces como a Amazon sem permissão escrita. **Pedido ENVIADO 21/10/2026** em inglês (Gmail, id 1a15f74fd733003d) | Aguardando resposta |

Alternativa permitida a qualquer momento: fotos tiradas pelo próprio titular dos produtos
(arquivo enviado ao repositório em `assets/fotos/` e registrado com `imagemFonte`).

## Texto para os formulários (Cadence e MSD)

> Olá. Mantenho o site Vitrine Achados (https://allanduarte93.github.io/vitrine-achados/), vitrine de
> curadoria com links de afiliado para a Amazon.com.br, com aviso de publicidade em todas as páginas.
> O site apresenta o produto [Sanduicheira Cadence Click 127 V | Bravecto 250 mg para cães de 4,5 a 10 kg].
> Peço autorização por escrito para exibir de 1 a 3 fotografias oficiais do produto, sem alteração
> (apenas redimensionamento), só nas páginas do site, com crédito à marca e remoção imediata a
> pedido. Se o pedido deve ir a outra área (marketing/imprensa), agradeço o encaminhamento ou o
> contato correto. Allan Duarte — allan.duarte93@gmail.com

## Mercado Livre — ampliação de 04/11/2026

50 produtos novos do Mercado Livre, escolhidos na Central de Afiliados (busca "Produtos
selecionados para você"). Cada um foi conferido no anúncio exato (/p/MLB…) em 04/11/2026:
condição "Novo", termômetro do vendedor no nível 5 (verde) e a foto exibida pela Central
presente na galeria do anúncio. Links gerados no Gerador de Links oficial (etiqueta
ad20260429184559). Registro por produto em `data/imagens.json` (autorização `condicional`
ao ML ativo, mesma base da resposta escrita no caso 490066167).

Rejeitados na conferência (2 de 52):
- MLB33997846 — Controle Sony DualSense branco: vendedor com termômetro nível 3 (não verde).
- MLB54738532 — Protetor solar L'Oréal Solar Expertise com cor: título diz cor 6.0 e a ficha diz
  cor 2.0; a variação da foto não pôde ser confirmada.
