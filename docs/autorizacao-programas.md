# Autorização dos programas de afiliados

Situação em 20/10/2026. `config.afiliados.programasConfirmados` só fica `true` com evidência documentada aqui.
Dados da conta: informados pelo Cowork em `entrada/status_produtos.json` (campo `contas`).

| Programa | Conta | Site cadastrado | Aprovação adicional exigida? | Pode publicar? |
|---|---|---|---|---|
| Amazon | ativa; ID `vitrineachados-20` criado para este site | sim, na lista de sites da conta | não antes de publicar: a análise acontece depois das vendas | **sim**: `amazon: true` |
| Shopee | ativa (ID 18356851019) | sim, como mídia "Other", sem selo Verificado | **sim**: os termos exigem mídia aprovada | **não**: falta a aprovação |
| Mercado Livre | ativa (etiqueta ad20260429184559) | sim, como "Otra red" | **sim**: sites passam por análise do ML | **não**: falta o resultado da análise |

## Amazon: confirmado

- **Seu Site.** O Acordo Operacional define "Seu Site" como site, conteúdo de mídia social ou app com links para a Amazon, identificado na conta. Os Links Especiais devem usar o formato rastreado com o ID de Associado. Fontes: [Acordo Operacional](https://associados.amazon.com.br/help/operating/agreement) e [Políticas do Programa](https://associados.amazon.com.br/help/operating/policies/).
- **Análise depois das vendas.** Pela ajuda oficial, a inscrição é analisada depois que o associado envia vendas qualificadas pelos seus links: são 3 em até 180 dias. A análise cobre todas as plataformas listadas. Ou seja, o programa espera os links publicados nos sites cadastrados antes da análise, e não existe etapa de aprovação do site antes de publicar. Fonte: [ajuda oficial](https://associados.amazon.com.br/help/node/topic/G7MJTPEP9NC3YKMG).
- **Risco que continua.** Se não houver 3 vendas qualificadas em 180 dias, ou se a análise reprovar o site, a conta é encerrada. Isso não impede a publicação agora.
- **Obrigações cumpridas pelo site:**
  - declaração "Como Associado da Amazon, ganhamos com compras qualificadas." junto aos botões da Amazon, no rodapé e no aviso de afiliados;
  - nenhum preço da Amazon exibido;
  - links com `tag=vitrineachados-20`, conferidos pelo validador (`afiliados.amazonTag`);
  - nenhuma tag do contratipo.app.

## Shopee: bloqueado

- Os termos oficiais definem "Mídia de Afiliado" como os canais "registrados no programa e aprovados pela Shopee". Fontes: [Programa de Afiliados Shopee: Termos e Condições](https://help.shopee.com.br/portal/10/article/124094-Programa-de-Afiliados-Shopee-Termos-e-Condi%C3%A7%C3%B5es) e [Termos do Programa de Afiliados da Shopee](https://help.shopee.com.br/portal/4/article/76443-Programa-de-Afiliados-da-Shopee-Termos-e-Condi). Outra versão dos termos diz que a mídia pode incluir sites "mediante aprovação da Shopee".
- A falta do selo "Verificado" não prova proibição, e o link gerado não prova autorização.
- **O que falta:** o painel de afiliados mostrando a mídia `allanduarte93.github.io/vitrine-achados` como aprovada, ou uma confirmação por escrito da Shopee.

## Mercado Livre: bloqueado

- Segundo o Cowork, os termos do Programa de Afiliados e Criadores submetem sites à análise do ML. A página oficial também fala em vincular os canais e aguardar aprovação. Fonte: [página oficial do programa](https://www.mercadolivre.com.br/l/afiliados-home).
- O painel não mostra status para o canal cadastrado.
- **O que falta:** o painel mostrando o site como aprovado, ou uma confirmação por escrito do ML.

## Como a publicação usa isto

O workflow Publicar roda com `SOMENTE_CONFIRMADOS=1`: só entram ofertas de lojas com `true`. Quando a Shopee ou o ML confirmarem, basta trocar o valor da loja para `true` e publicar de novo.
