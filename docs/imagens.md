# Fotos dos produtos — registro de fonte, licença e status

Regra do site: uma foto só aparece se o produto tiver `imagem` + `imagemPermitida: true` +
`imagemFonte` (quem autorizou e quando). Com isso ela entra automaticamente na página inicial,
nas categorias, na busca e na página do produto. Sem autorização, o site mostra a ficha do
produto (tipo + fatos do anúncio). Nada de foto genérica, inventada ou gerada por IA.

Fonte de verdade por produto: **`data/imagens.json`**, com url, fonte, identificação (ASIN, MLB ou
loja.item da Shopee), variação, autorização e evidência. O build só mostra a foto quando o registro
do próprio produto a libera, com a mesma url e identificação igual à da oferta. Se algo não bater,
o produto fica com a ficha visual, nunca com a foto de outro item. Uma licença `condicional` (ex.:
Shopee, válida só em Mídia de Afiliado aprovada) aparece na prévia, mas só é publicada quando a
loja da condição estiver confirmada em `config.afiliados.programasConfirmados`.
`npm run checar-fotos` (workflow "Checar links") confere se cada foto liberada responde como
imagem e se pertence ao anúncio.

Situação em 21/10/2026: **8 de 30 fotos liberadas** (Mercado Livre); Amazon e Shopee seguem sem foto.

| Loja | Produtos | Foto real disponível | Autorização | Publicada |
|---|---|---|---|---|
| Amazon | 10 | não | pendente: só pela Creators API (exige 10 vendas em 30 dias) ou por licença do fabricante (pedidos abaixo) | não |
| Shopee | 10 | sim (Portal de Afiliados) | condicional: Termos 2.2 só em Mídia aprovada; aprovação do site pedida em 20/10 | não (Shopee não confirmada) |
| Mercado Livre | 10 | 8 (Central de Afiliados) | autorizada por escrito no caso 490066167 (21/10): imagens das ferramentas oficiais; registro `condicional` ao ML ativo | 8 (a partir da publicação de 21/10) |

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
