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
| 6 | Potes Electrolux 12 peças: micro-ondas, freezer, lava-louças | Pendente | Perguntas objetivas, quase sem concorrência; anúncio já confirma micro-ondas, lava-louças e BPA |
| 7 | Bravecto 250 mg: o que diz a bula (faixa de peso, 12 semanas, contraindicações) | Pendente — exige leitura da bula brasileira oficial | Demanda alta; risco: não dar orientação de dose |
| 8 | Elseve Óleo Extraordinário: úmido ou seco, proteção térmica | Pendente | Concorrência fraca; fatos do anúncio confirmam 230 °C |
| — | Omo 5 L e Logitech M170 | Respondidos como perguntas frequentes na página do produto | Demanda fraca em português |

Quando Shopee e Mercado Livre forem autorizados, os produtos dessas lojas entram no
build automaticamente (`programasConfirmados`), e esta pauta ganha os temas deles.
