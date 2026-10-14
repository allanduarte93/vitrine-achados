// Registro anônimo de cliques nos botões de loja. Sem cookies e sem dados pessoais.
(function () {
  var endpoint = document.body.getAttribute("data-endpoint");
  if (!endpoint) return;
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
})();
