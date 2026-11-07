const btnMenu = document.getElementById('btn-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

/* ---------- Menu lateral no celular (botão hambúrguer, hoje oculto no CSS) ---------- */
function abrirMenu() {
  sidebar.classList.add('is-open');
  overlay.hidden = false;
  btnMenu.setAttribute('aria-expanded', 'true');
  btnMenu.setAttribute('aria-label', 'Fechar menu');
}

function fecharMenu() {
  sidebar.classList.remove('is-open');
  overlay.hidden = true;
  btnMenu.setAttribute('aria-expanded', 'false');
  btnMenu.setAttribute('aria-label', 'Abrir menu');
}

btnMenu.addEventListener('click', () => {
  sidebar.classList.contains('is-open') ? fecharMenu() : abrirMenu();
});
overlay.addEventListener('click', fecharMenu);

/* ---------- Menu do perfil: Meu cadastro e Sair ---------- */
const btnPerfil = document.getElementById('btn-perfil');
const menuPerfil = document.getElementById('menu-perfil');

function abrirPerfil() {
  menuPerfil.hidden = false;
  btnPerfil.setAttribute('aria-expanded', 'true');
}

function fecharPerfil() {
  menuPerfil.hidden = true;
  btnPerfil.setAttribute('aria-expanded', 'false');
}

btnPerfil.addEventListener('click', (evento) => {
  evento.stopPropagation();
  menuPerfil.hidden ? abrirPerfil() : fecharPerfil();
});

document.addEventListener('click', (evento) => {
  if (!menuPerfil.hidden && !menuPerfil.contains(evento.target)) fecharPerfil();
});

document.getElementById('btn-sair').addEventListener('click', () => {
  fecharPerfil();
  if (confirm('Deseja realmente sair da sua conta?')) {
    window.location.href = 'index.html';
  }
});

/* ---------- Modal "Meu cadastro" (criado aqui para não repetir HTML em cada tela) ---------- */
const modalCadastro = document.createElement('div');
modalCadastro.className = 'modal hidden';
modalCadastro.id = 'modal-cadastro';
modalCadastro.innerHTML = `
  <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="cadastro-titulo">
    <h2 class="modal__title" id="cadastro-titulo">Meu cadastro</h2>
    <ul class="modal__list">
      <li class="modal__row"><span class="modal__label">Nome</span><span class="modal__value">Ana Souza</span></li>
      <li class="modal__row"><span class="modal__label">E-mail</span><span class="modal__value">ana@email.com</span></li>
      <li class="modal__row"><span class="modal__label">Titular</span><span class="modal__value">Pessoa física</span></li>
    </ul>
    <div class="modal__actions">
      <button type="button" class="modal__btn modal__btn--outline" id="cadastro-fechar">Fechar</button>
    </div>
  </div>`;
document.body.appendChild(modalCadastro);

const btnCadastro = document.getElementById('btn-cadastro');
const btnCadastroFechar = document.getElementById('cadastro-fechar');

function abrirCadastro() {
  fecharPerfil();
  modalCadastro.classList.remove('hidden');
  btnCadastroFechar.focus();
}

function fecharCadastro() {
  modalCadastro.classList.add('hidden');
  btnPerfil.focus();
}

btnCadastro.addEventListener('click', abrirCadastro);
btnCadastroFechar.addEventListener('click', fecharCadastro);
modalCadastro.addEventListener('click', (evento) => {
  if (evento.target === modalCadastro) fecharCadastro();
});

/* ---------- Esc fecha o que estiver aberto ---------- */
document.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  if (!modalCadastro.classList.contains('hidden')) {
    fecharCadastro();
  } else if (!menuPerfil.hidden) {
    fecharPerfil();
    btnPerfil.focus();
  } else if (sidebar.classList.contains('is-open')) {
    fecharMenu();
    btnMenu.focus();
  }
});
