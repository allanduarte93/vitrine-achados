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

  // 2) Filtros da página de categoria (loja + ordenação).
  var form = document.querySelector("[data-filtros]");
  var grade = document.querySelector("[data-grade]");
  if (form && grade) {
    form.hidden = false;
    var cards = Array.prototype.slice.call(grade.querySelectorAll(".card"));
    var aplicar = function () {
      var lojas = Array.prototype.map.call(form.querySelectorAll('input[name="loja"]:checked'), function (i) { return i.value; });
      var ordem = form.querySelector('select[name="ordem"]').value;
      var visiveis = 0;
      cards.forEach(function (c) {
        var tem = (c.getAttribute("data-lojas") || "").split(" ").some(function (l) { return lojas.indexOf(l) > -1; });
        c.hidden = !tem;
        if (tem) visiveis++;
      });
      cards.slice().sort(function (a, b) {
        if (ordem === "preco") {
          var pa = parseFloat(a.getAttribute("data-preco")) || Infinity, pb = parseFloat(b.getAttribute("data-preco")) || Infinity;
          if (pa !== pb) return pa - pb;
        }
        return a.getAttribute("data-nome").localeCompare(b.getAttribute("data-nome"), "pt-BR");
      }).forEach(function (c) { grade.appendChild(c); });
      var cont = form.querySelector("[data-contagem]");
      if (cont) cont.textContent = visiveis + (visiveis === 1 ? " produto" : " produtos");
    };
    form.addEventListener("change", aplicar);
  }

  // 3) Busca (roda no navegador, sobre o índice publicado).
  var resultados = document.querySelector("[data-resultados]");
  if (resultados) {
    var params = new URLSearchParams(location.search);
    var termo = (params.get("q") || "").trim();
    var campo = document.getElementById("q2");
    if (campo) campo.value = termo;
    var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var escapar = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
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
      if (!achados.length) {
        resultados.innerHTML = '<p class="vazio">Nenhum produto encontrado para “' + escapar(termo) + '”. Tente outro termo ou navegue pelas categorias.</p>';
        return;
      }
      resultados.innerHTML = '<p class="sub">' + achados.length + (achados.length === 1 ? " produto" : " produtos") + (termo ? " para “" + escapar(termo) + "”" : "") + '</p><div class="grade-prod">' +
        achados.map(function (p) {
          return '<article class="card">' + (p.imagem ? '<div class="card-img"><img src="' + escapar(p.imagem) + '" alt="' + escapar(p.nome) + '" width="600" height="600" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>' : "") + '<div class="card-corpo"><span class="card-cat">' + escapar(p.categoria) + '</span><h3><a href="' + escapar(p.url) + '">' + escapar(p.nome) + "</a></h3>" +
            (p.marca ? '<span class="card-marca">' + escapar(p.marca) + "</span>" : "") +
            (p.preco ? '<span class="card-preco">a partir de<strong>' + p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + "</strong>preço consultado</span>" : "") +
            '<div class="card-lojas">' + p.lojas.map(function (l) { return '<span class="marca-loja">' + escapar(l) + "</span>"; }).join("") + "</div>" +
            '<a class="btn btn-prim" href="' + escapar(p.url) + '">Ver ofertas</a></div></article>';
        }).join("") + "</div>";
    }).catch(function () {
      resultados.innerHTML = '<p class="vazio">Não foi possível carregar a busca agora. Tente novamente em instantes.</p>';
    });
  }
})();
