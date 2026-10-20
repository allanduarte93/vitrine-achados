/**
 * Ícones e ilustrações originais da Vitrine Achados (SVG inline, traço em currentColor).
 * Desenhados para este projeto: sem marcas ou logotipos de terceiros.
 */

const svg = (corpo, { tamanho = 24, classe = "ico", vb = "0 0 24 24", titulo = "" } = {}) =>
  `<svg class="${classe}" width="${tamanho}" height="${tamanho}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${titulo ? `role="img" aria-label="${titulo}"` : 'aria-hidden="true" focusable="false"'}>${corpo}</svg>`;

const P = {
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
  escudo: '<path d="M12 3 4.5 6v5.6c0 4.6 3.2 8.2 7.5 9.4 4.3-1.2 7.5-4.8 7.5-9.4V6L12 3Z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/>',
  loja: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-4.5h4V20"/>',
  comparar: '<path d="M7 4v16"/><path d="M17 4v16"/><path d="M3.5 8.5 7 5l3.5 3.5"/><path d="M13.5 15.5 17 19l3.5-3.5"/>',
  seta: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  externo: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  cofre: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.6 0-2.8.8-2.8 2s1.1 1.7 2.8 2.1c1.8.4 2.9 1 2.9 2.2s-1.3 2-2.9 2c-1.4 0-2.5-.6-3-1.5"/><path d="M12 6.3v1.6m0 8.2v1.6"/>',
  etiqueta: '<path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.4 1.4 0 0 1 0 2l-7 7a1.4 1.4 0 0 1-2 0l-8-8Z"/><circle cx="8" cy="8" r="1.6"/>',
  lupaCheck: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/><path d="m7.8 10.6 1.9 1.9 3.4-3.6"/>',
  mensagem: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
  cadeado: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
  filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  // Categorias
  eletronicos: '<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="13.5" width="4" height="6" rx="1.5"/>',
  casa: '<path d="M4 11h16"/><path d="M5.5 11v6.5a2.5 2.5 0 0 0 2.5 2.5h8a2.5 2.5 0 0 0 2.5-2.5V11"/><path d="M3 11h1.5m15 0H21"/><path d="M9 7.5c0-1.5 1-1.5 1-3m4 3c0-1.5 1-1.5 1-3"/>',
  beleza: '<path d="M9 21h6v-8.5H9V21Z"/><path d="M9.5 12.5V9l3-5.5 2 1.5v7.5"/><path d="M18.5 5.5v2M17.5 6.5h2M5.5 8v1.6M4.7 8.8h1.6"/>',
  saude: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/><path d="M7.5 12.5h2.3l1.2-2 2 4 1.2-2h2.3"/>',
  esporte: '<path d="M6.5 8v8M17.5 8v8"/><path d="M3.5 10v4M20.5 10v4"/><path d="M6.5 12h11"/>',
  ferramentas: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7a1.9 1.9 0 0 0 2.7 2.7l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.3-.4-.4-2.3 2.4-2.4Z"/>',
  bebes: '<path d="M10 3.5h4"/><path d="M10.5 3.5v2.2L8.5 8.5v10A2.5 2.5 0 0 0 11 21h2a2.5 2.5 0 0 0 2.5-2.5v-10l-2-2.8V3.5"/><path d="M8.5 12h3m-3 3h3"/>',
  pets: '<circle cx="8" cy="8.5" r="1.7"/><circle cx="16" cy="8.5" r="1.7"/><circle cx="5" cy="12.5" r="1.5"/><circle cx="19" cy="12.5" r="1.5"/><path d="M12 12c-2.6 0-5 3.6-5 5.6 0 1.8 1.5 2.4 2.7 2.1 1-.3 1.6-.7 2.3-.7s1.3.4 2.3.7c1.2.3 2.7-.3 2.7-2.1 0-2-2.4-5.6-5-5.6Z"/>',
  games: '<path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.4 5.4l-.8 4a2.3 2.3 0 0 1-4 .9L14.5 16h-5l-1.6 1.8a2.3 2.3 0 0 1-4-.9l-.8-4a4.5 4.5 0 0 1 4.4-5.4Z"/><path d="M8 10.5v3M6.5 12h3"/><path d="M15.5 11.2v.1M17 12.8v.1"/>',
  informatica: '<rect x="4.5" y="5" width="15" height="10" rx="1.5"/><path d="M2.5 19h19"/><path d="M9.5 15.5 9 19m5.5-3.5.5 3.5"/>',
  moda: '<path d="M8.5 4 4 6.5l1.7 4 1.8-.9V20h9V9.6l1.8.9 1.7-4L15.5 4"/><path d="M8.5 4a3.5 3.5 0 0 0 7 0"/>',
  livros: '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13v14H6a1.5 1.5 0 0 0-1.5 1.5v-14Z"/><path d="M4.5 19.5A1.5 1.5 0 0 0 6 21h13v-3"/><path d="M9 8h6"/>',
  outros: '<path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.4 1.4 0 0 1 0 2l-7 7a1.4 1.4 0 0 1-2 0l-8-8Z"/><circle cx="8" cy="8" r="1.6"/>',
};

export const icone = (nome, opcoes) => svg(P[nome] || P.outros, opcoes);

/** Escolhe o ícone de uma categoria pelo nome (ex.: "Casa e Cozinha" -> casa). */
export const iconeCategoria = (nome = "") => {
  const n = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const regras = [
    [/eletron|audio|fone|celular|smart|tv/, "eletronicos"],
    [/informat|computador|notebook|escritorio/, "informatica"],
    [/\bgames?\b|console|videogame|\bjogos? (de )?(video|tabuleiro)/, "games"],
    [/\bcasa\b|cozinha|\blar\b|decor|eletrodom|panela/, "casa"],
    [/beleza|cuidado|perfum|maquiag|cabelo/, "beleza"],
    [/saude|bem-estar|bem estar|fitness|suplement/, "saude"],
    [/esporte|lazer|academia|camping|bike/, "esporte"],
    [/ferrament|construc|jardim|automot/, "ferramentas"],
    [/bebe|infantil|crianca|brinquedo/, "bebes"],
    [/\bpets?\b|animal|cachorr|\bgat[oa]s?\b/, "pets"],
    [/moda|roupa|calcad|acessorio|bolsa/, "moda"],
    [/livro|papelaria|leitura/, "livros"],
  ];
  return (regras.find(([re]) => re.test(n)) || [null, "outros"])[1];
};

/** Tons por categoria (fundo suave + traço), todos com contraste AA sobre o fundo. */
export const TONS = {
  eletronicos: ["#e8efff", "#2546b8"],
  informatica: ["#e9f3ff", "#1f5aa6"],
  games: ["#f1e9ff", "#5b2bb5"],
  casa: ["#fff0e6", "#b4470f"],
  beleza: ["#ffeaf2", "#b1255c"],
  saude: ["#e7f7ef", "#127046"],
  esporte: ["#e6f6f8", "#0d6b78"],
  ferramentas: ["#fff5d9", "#8a5a00"],
  bebes: ["#eaf4ff", "#2a5f9e"],
  pets: ["#fdf0e3", "#8f4d12"],
  moda: ["#f6ecff", "#7a2fa8"],
  livros: ["#eef1f5", "#3b4a63"],
  outros: ["#fff1ea", "#b8431b"],
};

/** Marca da Vitrine Achados: etiqueta com toldo de vitrine e visto de "conferido". */
export const marcaSvg = (tamanho = 36) => `<svg class="marca-svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <rect x="2" y="2" width="44" height="44" rx="13" fill="#FF5A1F"/>
  <path d="M9 13.5h30v4.2a3.75 3.75 0 0 1-7.5 0 3.75 3.75 0 0 1-7.5 0 3.75 3.75 0 0 1-7.5 0 3.75 3.75 0 0 1-7.5 0v-4.2Z" fill="#fff"/>
  <path d="M16.5 13.5v4.2a3.75 3.75 0 0 1-7.5 0v-4.2M31.5 13.5v4.2a3.75 3.75 0 0 0 7.5 0v-4.2" fill="#FFD3C2"/>
  <path d="M15.5 30.5 21.5 36.5 33 25" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Ilustração do banner: vitrine com produtos genéricos (sem marcas, sem preços). */
export const heroSvg = () => `<svg class="hero-arte" viewBox="0 0 560 440" role="img" aria-label="Ilustração de uma vitrine com fones, tênis, relógio, liquidificador e etiquetas conferidas">
  <defs>
    <linearGradient id="hg-fundo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7DC"/><stop offset="1" stop-color="#FFF6F1"/></linearGradient>
    <linearGradient id="hg-vidro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#F4F6FB"/></linearGradient>
  </defs>
  <circle cx="300" cy="230" r="196" fill="url(#hg-fundo)"/>
  <circle cx="470" cy="70" r="10" fill="#FFB596"/><circle cx="96" cy="120" r="6" fill="#9DB4FF"/><circle cx="500" cy="360" r="7" fill="#7FD9B0"/>
  <path d="M86 300l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="#FF5A1F" opacity=".85"/>
  <path d="M478 168l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#1B2A6B" opacity=".7"/>
  <!-- Vitrine -->
  <rect x="120" y="96" width="340" height="276" rx="22" fill="#14215A"/>
  <rect x="134" y="146" width="312" height="212" rx="12" fill="url(#hg-vidro)"/>
  <!-- Toldo -->
  <path d="M108 92h364v30a22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0 22.75 22.75 0 0 1-45.5 0V92Z" fill="#FF5A1F"/>
  <path d="M153.5 92v30a22.75 22.75 0 0 1-45.5 0V92Zm91 0v30a22.75 22.75 0 0 1-45.5 0V92Zm91 0v30a22.75 22.75 0 0 1-45.5 0V92Zm91 0v30a22.75 22.75 0 0 1-45.5 0V92Z" fill="#fff"/>
  <rect x="100" y="74" width="380" height="22" rx="11" fill="#14215A"/>
  <!-- Prateleira -->
  <rect x="134" y="282" width="312" height="10" fill="#E3E8F4"/>
  <!-- Fone -->
  <g transform="translate(160 186)" fill="none" stroke="#2546B8" stroke-width="7" stroke-linecap="round">
    <path d="M6 54V36a30 30 0 0 1 60 0v18"/>
    <rect x="0" y="48" width="16" height="34" rx="8" fill="#5B7BF0" stroke="none"/>
    <rect x="56" y="48" width="16" height="34" rx="8" fill="#5B7BF0" stroke="none"/>
  </g>
  <!-- Relógio -->
  <g transform="translate(262 200)">
    <rect x="14" y="-6" width="28" height="80" rx="10" fill="#C7D2F5"/>
    <rect x="2" y="14" width="52" height="54" rx="14" fill="#14215A"/>
    <rect x="9" y="21" width="38" height="40" rx="9" fill="#2CC489"/>
    <path d="M19 41h7l4-8 4 14 3-6h4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Liquidificador -->
  <g transform="translate(346 170)">
    <path d="M8 8h48l-7 74H15Z" fill="#DDF3FF" stroke="#7CB7DC" stroke-width="3"/>
    <path d="M14 46h36l-3 34H17Z" fill="#9FD8F7"/>
    <rect x="22" y="0" width="20" height="10" rx="3" fill="#14215A"/>
    <rect x="6" y="84" width="52" height="28" rx="8" fill="#FF5A1F"/>
    <circle cx="32" cy="98" r="6" fill="#fff"/>
  </g>
  <!-- Tênis -->
  <g transform="translate(170 300)">
    <path d="M4 34c0-12 6-20 14-24l14 10c8 6 22 6 34 8 10 2 16 6 16 12v4H4Z" fill="#fff" stroke="#14215A" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M4 38h78v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill="#FF5A1F"/>
    <path d="M24 18l6 4m-1-9 6 4" stroke="#14215A" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- Caixa -->
  <g transform="translate(330 296)">
    <rect x="0" y="10" width="86" height="44" rx="6" fill="#FFC9A8"/>
    <rect x="-4" y="0" width="94" height="16" rx="5" fill="#FF9B6A"/>
    <rect x="37" y="0" width="12" height="54" fill="#fff" opacity=".8"/>
  </g>
  <!-- Etiquetas conferidas -->
  <g transform="translate(408 196) rotate(12)">
    <path d="M0 10a10 10 0 0 1 10-10h50l20 22-20 22H10A10 10 0 0 1 0 34Z" fill="#fff" stroke="#14215A" stroke-width="3"/>
    <circle cx="66" cy="22" r="4" fill="#14215A"/>
    <path d="M14 22l8 8 16-16" fill="none" stroke="#12A15F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(64 214) rotate(-10)">
    <path d="M0 10a10 10 0 0 1 10-10h50l20 22-20 22H10A10 10 0 0 1 0 34Z" fill="#fff" stroke="#14215A" stroke-width="3"/>
    <circle cx="66" cy="22" r="4" fill="#14215A"/>
    <path d="M14 22l8 8 16-16" fill="none" stroke="#12A15F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Lupa -->
  <g transform="translate(396 284)">
    <circle cx="34" cy="34" r="30" fill="#ffffff" fill-opacity=".55" stroke="#14215A" stroke-width="8"/>
    <path d="M56 56l26 26" stroke="#14215A" stroke-width="12" stroke-linecap="round"/>
    <path d="M20 26a16 16 0 0 1 14-10" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;

/** Ilustração da comparação (genérica: sem preços nem lojas reais). */
export const comparaSvg = () => `<svg class="compara-arte" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <rect x="10" y="14" width="100" height="92" rx="16" fill="#FFF1EA"/>
  <path d="M42 46c0-12 8-20 18-20s18 8 18 20" fill="none" stroke="#2546B8" stroke-width="6" stroke-linecap="round"/>
  <rect x="34" y="44" width="12" height="24" rx="6" fill="#5B7BF0"/><rect x="74" y="44" width="12" height="24" rx="6" fill="#5B7BF0"/>
  <rect x="26" y="80" width="68" height="8" rx="4" fill="#FFC9A8"/><rect x="38" y="92" width="44" height="6" rx="3" fill="#FFDCC9"/>
</svg>`;
