/* Tema claro/escuro. Carregue no <head> (sem defer) para não piscar ao abrir a página. */
(function () {
  var CHAVE = 'ofh.tema';

  function lerSalvo() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function salvar(tema) {
    try { localStorage.setItem(CHAVE, tema); } catch (e) { /* sem armazenamento: vale só nesta página */ }
  }

  var atual = lerSalvo() === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.tema = atual;

  function atualizarBotoes() {
    var escuro = document.documentElement.dataset.tema === 'dark';
    document.querySelectorAll('.js-tema').forEach(function (b) {
      b.textContent = escuro ? 'Modo claro' : 'Modo escuro';
      b.setAttribute('aria-pressed', String(escuro));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    atualizarBotoes();
    document.querySelectorAll('.js-tema').forEach(function (b) {
      b.addEventListener('click', function () {
        var novo = document.documentElement.dataset.tema === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.tema = novo;
        salvar(novo);
        atualizarBotoes();
        document.dispatchEvent(new CustomEvent('temamudou', { detail: novo }));
      });
    });
  });
})();
