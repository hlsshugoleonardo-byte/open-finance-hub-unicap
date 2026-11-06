

const btnSair = document.getElementById('btn-sair');
const btnMenu = document.getElementById('btn-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');


btnSair.addEventListener('click', () => {
  if (confirm('Deseja realmente sair da sua conta?')) {
    console.log('Sessão encerrada. Redirecionando para o login...');
    window.location.href = 'index.html';
  }
});




document.querySelectorAll('.menu__link[href^="#"]').forEach((link) => {
  link.addEventListener('click', (evento) => {
    evento.preventDefault();
    console.log(`Página "${link.textContent}" ainda não foi criada.`);
  });
});


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


document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && sidebar.classList.contains('is-open')) {
    fecharMenu();
    btnMenu.focus();
  }
});
