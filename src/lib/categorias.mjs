/**
 * Categorias canônicas da vitrine (config.categoriasVitrine).
 * Encaixa nomes vindos de pesquisas ("Cozinha", "Fones e Áudio") na categoria
 * canônica de mesmo tema; nomes sem correspondência são mantidos como vieram.
 */
import { iconeCategoria } from "./icones.mjs";

export const canonicalizarCategoria = (nome, canonicas = []) => {
  const tema = iconeCategoria(nome || "");
  if (tema === "outros") return nome;
  const exata = canonicas.find((c) => c.toLowerCase() === String(nome).toLowerCase());
  if (exata) return exata;
  return canonicas.find((c) => iconeCategoria(c) === tema) || nome;
};
