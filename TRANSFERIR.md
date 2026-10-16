> **Concluído em 2026-10-16:** projeto publicado em https://github.com/allanduarte93/vitrine-achados. Este guia fica só como referência.

# Transferir para um repositório próprio

Escolha **uma** das opções. Todas preservam todos os arquivos.

## A) Pelo pacote `vitrine-achados.bundle` (mais curto, inclui o histórico Git)

1. No GitHub, crie um repositório **vazio** (sem README), por exemplo `vitrine-achados`. Para usar o GitHub Pages grátis, ele precisa ser público.
2. No seu computador:

```bash
git clone vitrine-achados.bundle vitrine-achados
cd vitrine-achados
git remote set-url origin https://github.com/allanduarte93/vitrine-achados.git
git push -u origin main
npm test   # deve mostrar 13 testes passando
```

## B) Direto do branch onde o projeto nasceu, sem baixar arquivos

```bash
git clone --branch claude/affiliate-project-audit-niurxs https://github.com/allanduarte93/perfumear-similares.git tmp
cd tmp
git subtree split --prefix=maquina-afiliados -b vitrine
git push https://github.com/allanduarte93/vitrine-achados.git vitrine:main
```

Isso leva só a pasta `maquina-afiliados/` e o histórico dela. O repositório de origem não é alterado.

## C) Pelo Claude

Crie o repositório vazio e informe o nome. O Claude adiciona o repositório à sessão e faz o push do `main`.
