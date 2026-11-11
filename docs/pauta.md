# Pauta de conteúdo (motor orgânico)

Fila priorizada de guias e respostas. Origem: pesquisa de 20–21/10/2026 em resultados
de busca brasileiros (sem volumes inventados; demanda medida qualitativamente pela
quantidade de páginas, editoras e fóruns tratando o tema).

Regras para qualquer conteúdo novo (o build barra o que não cumprir — `src/lib/guias.mjs`):
- só fatos do anúncio oficial, do fabricante ou de fonte citada em `fontes`;
- nada de "testamos", preço, desconto, nota, "mais vendido" ou promessa absoluta;
- mínimo 350 palavras, 2+ seções, resumo de 80–180 caracteres, `status: "aprovado"`;
- não repetir descrições de produto nem outros guias (sobreposição > 35% é barrada);
- medicamento veterinário: só o que está na bula/anúncio, sempre remetendo ao veterinário.

| # | Pauta | Situação | Por quê |
|---|---|---|---|
| 1 | Fire TV Stick HD novo: o que precisa, apps, Vega OS, sem apps de fora da loja | **Publicado** (`fire-tv-stick-hd-o-que-saber`) | Modelo novo, intenção alta, portais cobrem pouco a parte prática |
| 2 | Echo Dot × Fire TV Stick + Alexa+ | **Publicado/atualizado** (`echo-dot-ou-fire-tv-stick`) | Alexa+ chegou ao Brasil em 06/2026 |
| 3 | Sanduicheira Cadence Click: bivolt?, potência, consumo, limpeza | **Publicado** (`sanduicheira-cadence-click-127v`) | Concorrência fraca, dúvidas objetivas |
| 4 | CeraVe × Cicaplast + FAQ (perfume, bebês, uso conjunto) | **Publicado/ampliado** | Demanda confirmada, farmácias dominam |
| 5 | Echo Dot 5ª geração × Echo Dot Max × Echo Pop | Pendente — só quando os outros modelos estiverem no catálogo com link conferido | Muita demanda; precisa dos produtos publicados |
| 6 | Potes Electrolux 12 peças: micro-ondas, freezer, lava-louças | **Publicado** (`potes-electrolux-12-pecas-micro-ondas-freezer`, 04/11) — fontes: [Electrolux — ficha do conjunto de 12 potes de plástico](https://content.electrolux.com.br/brasil/electrolux/conjunto-potes-hermeticos-de-plastico-12unid/index.html?v=BaYTg4), [Loja oficial Electrolux — 12 unidades cinza](https://loja.electrolux.com.br/potes-hermeticos-de-plastico-cinza-com-12-unidades/p). Fatos usados: micro-ondas até 3 min sem tampa, não usar na função grelhar, freezer até -20 °C, geladeira, lava-louças, polipropileno livre de BPA, anel de silicone, registro de data, empilháveis. Ressalvas: as páginas oficiais não citam o código A23122901 (a loja usa a referência 41046086) e divergem na lista de medidas, por isso o guia não lista medidas por pote nem capacidades; não há informação oficial sobre forno, e o guia diz isso. Elseve (pauta 8) ficou para depois: nenhuma página oficial da L'Oréal Paris encontrada nesta execução | Perguntas objetivas, quase sem concorrência |
| 7 | Bravecto comprimido: o que diz o fabricante (faixa de peso, 12 semanas, contraindicações) | **Publicado** (`bravecto-comprimido-o-que-diz-o-fabricante`, 28/10) — fontes: [MSD Saúde Animal — Bravecto](https://www.msd-saude-animal.com.br/produto/bravecto/), [br.bravecto.com — comprimidos](https://br.bravecto.com/bravecto-comprimidos-caes/), [br.bravecto.com — perguntas frequentes](https://br.bravecto.com/perguntas-frequentes/). Faixas de peso só das duas apresentações do catálogo (250 mg e 1000 mg); sem orientação de dose, sem reações adversas (não constam nas páginas oficiais lidas; o guia remete à bula da caixa e ao veterinário) | Demanda alta; risco: não dar orientação de dose |
| 8 | Elseve Óleo Extraordinário: úmido ou seco, proteção térmica | **Publicado** (`elseve-oleo-extraordinario-umido-ou-seco`, 11/11) — fontes: [L'Oréal Paris Brasil — página do produto](https://www.loreal-paris.com.br/elseve/oleo-extraordinario/oleo-extraordinario), [L'Oréal Paris Brasil — linha Óleo Extraordinário](https://www.loreal-paris.com.br/cuidados-com-o-cabelo/elseve/oleo-extraordinario) (o domínio oficial é `loreal-paris.com.br`, com hífen; por isso a busca de 04/11 não achou). Fatos usados: molhado ou seco, 3 a 4 pressões, sem enxágue, antes da escova ou como finalizador, protege até 230 °C (usar antes do calor), 6 óleos de flores, se adapta a todos os tipos (linha posicionada para cabelos secos), usos sugeridos (pré-shampoo, umectação, misturado a máscara/condicionador/creme de pentear). Fora do guia de propósito: alegações de marketing ("10x mais nutrição", "72 horas", "nº 1 do mundo") e a nota da página. As páginas não trazem ingredientes nem advertências: o guia remete à embalagem | Concorrência fraca; fatos do anúncio confirmam 230 °C |
| — | Omo 5 L e Logitech M170 | Respondidos como perguntas frequentes na página do produto | Demanda fraca em português |

Quando Shopee e Mercado Livre forem autorizados, os produtos dessas lojas entram no
build automaticamente (`programasConfirmados`), e esta pauta ganha os temas deles.
