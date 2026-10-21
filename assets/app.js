// Vitrine Achados — melhorias progressivas. Sem cookies e sem dados pessoais.
(function () {
  "use strict";
  var css = document.querySelector('link[rel="stylesheet"]');
  var raiz = css ? new URL("../", css.href) : new URL("/", location.href);

  // 1) Registro anônimo de cliques nos botões de loja.
  var endpoint = document.body.getAttribute("data-endpoint");
  if (endpoint) {
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[data-oferta]");
      if (!a) return;
      var payload = JSON.stringify({
        produto: a.getAttribute("data-produto"),
        loja: a.getAttribute("data-loja"),
        pagina: location.pathname,
        origem: document.referrer ? new URL(document.referrer).hostname : "",
      });
      try {
        if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
        else fetch(endpoint, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true });
      } catch (e) { /* o clique segue para a loja de qualquer forma */ }
    });
  }

  // 2) Filtros (categoria, loja e ordenação verificável) nas grades de produtos.
  var ligarFiltros = function (form, grade) {
    form.hidden = false;
    var cards = Array.prototype.slice.call(grade.querySelectorAll(".card"));
    cards.forEach(function (c, i) { c.setAttribute("data-ordem", i); });
    var aplicar = function () {
      var marcadas = form.querySelectorAll('input[name="loja"]:checked, input[type="hidden"][name="loja"]');
      var lojas = Array.prototype.map.call(marcadas, function (i) { return i.value; });
      var selCat = form.querySelector('select[name="categoria"]');
      var cat = selCat ? selCat.value : "";
      var ordem = form.querySelector('select[name="ordem"]').value;
      var visiveis = 0;
      cards.forEach(function (c) {
        var temLoja = (c.getAttribute("data-lojas") || "").split(" ").some(function (l) { return lojas.indexOf(l) > -1; });
        var temCat = !cat || c.getAttribute("data-categoria") === cat;
        c.hidden = !(temLoja && temCat);
        if (!c.hidden) visiveis++;
      });
      cards.slice().sort(function (a, b) {
        if (ordem === "preco") {
          var pa = parseFloat(a.getAttribute("data-preco")) || Infinity, pb = parseFloat(b.getAttribute("data-preco")) || Infinity;
          if (pa !== pb) return pa - pb;
        }
        if (ordem === "nome") return a.getAttribute("data-nome").localeCompare(b.getAttribute("data-nome"), "pt-BR");
        return a.getAttribute("data-ordem") - b.getAttribute("data-ordem");
      }).forEach(function (c) { grade.appendChild(c); });
      var cont = form.querySelector("[data-contagem]");
      if (cont) cont.textContent = visiveis + (visiveis === 1 ? " produto" : " produtos");
    };
    form.addEventListener("change", aplicar);
    return aplicar;
  };
  var form = document.querySelector("[data-filtros]");
  var grade = document.querySelector("[data-grade]");
  if (form && grade) ligarFiltros(form, grade);

  // 3) Busca (roda no navegador, sobre o índice publicado). Mesmo card da vitrine.
  var resultados = document.querySelector("[data-resultados]");
  if (resultados) {
    var params = new URLSearchParams(location.search);
    var termo = (params.get("q") || "").trim();
    var campo = document.getElementById("q2");
    if (campo) campo.value = termo;
    var filtros = document.querySelector("[data-filtros-busca]");
    var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
    var escapar = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var ARTIGO = { amazon: "da Amazon", mercadolivre: "do Mercado Livre", shopee: "da Shopee" };
    var ext = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>';
    var card = function (p) {
      var unica = p.ofertas && p.ofertas.length === 1 ? p.ofertas[0] : null;
      var loja = function (o) { return '<span class="marca-loja ' + escapar(o.loja) + '"><i></i>' + escapar(o.nome) + "</span>"; };
      var acao = unica
        ? '<a class="btn btn-prim btn-loja" href="' + escapar(unica.url) + '" target="_blank" rel="sponsored nofollow noopener" data-oferta data-produto="' + escapar(p.id) + '" data-loja="' + escapar(unica.loja) + '">Ver produto na loja<span class="sr"> ' + escapar(unica.nome) + " (abre em nova aba)</span> " + ext + "</a>" +
          '<a class="card-detalhes" href="' + escapar(p.url) + '">Detalhes do produto</a>'
        : '<a class="btn btn-prim" href="' + escapar(p.url) + '">Comparar ' + (p.ofertas || []).length + " lojas</a>";
      var foto = p.imagem
        ? '<img src="' + escapar(p.imagem) + '" alt="' + escapar(p.nome) + '" width="600" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
        : '<div class="sem-foto compacta"><strong class="sem-foto-marca">' + escapar(p.marca || p.categoria) + '</strong><span class="sem-foto-nota">Sem foto aqui · fotos na loja</span></div>';
      return '<article class="card' + (p.imagem ? " com-foto" : "") + '"><a class="card-img" href="' + escapar(p.url) + '" tabindex="-1" aria-hidden="true">' + foto + "</a>" +
        '<div class="card-corpo"><span class="card-cat">' + escapar(p.categoria) + '</span><h3><a href="' + escapar(p.url) + '">' + escapar(p.nome) + "</a></h3>" +
        (p.marca ? '<span class="card-marca">' + escapar(p.marca) + "</span>" : "") +
        (p.preco ? '<span class="card-preco"><strong>' + p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "</strong>preço consultado</span>" : "") +
        '<p class="card-loja">' + (unica ? loja(unica) + "<span>compra concluída na loja</span>" : (p.ofertas || []).map(loja).join("")) + "</p>" + acao + "</div></article>";
    };
    fetch(new URL("busca.json", raiz)).then(function (r) { return r.json(); }).then(function (dados) {
      var lista = dados.produtos || [];
      if (!lista.length) {
        resultados.innerHTML = '<p class="vazio">Nossa vitrine está em curadoria: os primeiros produtos com link conferido aparecem aqui em breve.</p>';
        return;
      }
      var palavras = norm(termo).split(/\s+/).filter(Boolean);
      var achados = lista.filter(function (p) {
        var alvo = norm([p.nome, p.marca, p.categoria, p.lojas.join(" ")].join(" "));
        return palavras.every(function (w) { return alvo.indexOf(w) > -1; });
      });
      var mostrar = function () {
        var cat = filtros && filtros.querySelector('select[name="categoria"]') ? filtros.querySelector('select[name="categoria"]').value : "";
        var marcadas = filtros ? Array.prototype.map.call(filtros.querySelectorAll('input[name="loja"]:checked'), function (i) { return i.value; }) : null;
        var temLojas = filtros && filtros.querySelector('input[name="loja"]');
        var ordem = filtros ? filtros.querySelector('select[name="ordem"]').value : "padrao";
        var vis = achados.filter(function (p) {
          var okCat = !cat || p.categoriaSlug === cat;
          var okLoja = !temLojas || (p.ofertas || []).some(function (o) { return marcadas.indexOf(o.loja) > -1; });
          return okCat && okLoja;
        }).sort(function (a, b) {
          if (ordem === "preco") return (a.preco || Infinity) - (b.preco || Infinity) || a.nome.localeCompare(b.nome, "pt-BR");
          if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
          return Number(!!b.imagem) - Number(!!a.imagem) || Number(!!b.prioritario) - Number(!!a.prioritario) || a.nome.localeCompare(b.nome, "pt-BR");
        });
        if (!vis.length) {
          resultados.innerHTML = '<p class="vazio">Nenhum produto encontrado' + (termo ? " para “" + escapar(termo) + "”" : "") + '. Tente outro termo, ajuste os filtros ou <a href="./">veja todos</a>.</p>';
          return;
        }
        resultados.innerHTML = '<p class="sub">' + vis.length + (vis.length === 1 ? " produto" : " produtos") + (termo ? " para “" + escapar(termo) + "”" : "") + '</p><div class="grade-prod">' + vis.map(card).join("") + "</div>";
      };
      if (filtros) { filtros.hidden = false; filtros.addEventListener("change", mostrar); }
      mostrar();
    }).catch(function () {
      resultados.innerHTML = '<p class="vazio">Não foi possível carregar a busca agora. Tente novamente em instantes.</p>';
    });
  }
})();
