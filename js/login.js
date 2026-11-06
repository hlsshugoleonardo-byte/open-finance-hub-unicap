


const form        = document.getElementById('login-form');
const inputSenha  = document.getElementById('senha');
const btnToggle   = document.getElementById('toggle-senha');
const itensRegras = document.querySelectorAll('.rules__item');


btnToggle.addEventListener('click', () => {
  const estaOculta = inputSenha.type === 'password';

  
  inputSenha.type = estaOculta ? 'text' : 'password';

  
  btnToggle.textContent = estaOculta ? 'Ocultar' : 'Mostrar';
  btnToggle.setAttribute('aria-label', estaOculta ? 'Ocultar senha' : 'Mostrar senha');
});



const regras = {
  tamanho:   (valor) => valor.length >= 8,
  maiuscula: (valor) => /[A-ZÀ-Ý]/.test(valor),
  numero:    (valor) => /\d/.test(valor),
  simbolo:   (valor) => /[^A-Za-z0-9\s]/.test(valor)
};


function atualizarItem(item, atendida) {
  item.classList.toggle('is-ok', atendida);
  item.querySelector('.rules__icon').textContent = atendida ? '✓' : '×';
  item.querySelector('.rules__status').textContent = atendida ? '(atendido)' : '(pendente)';
}


function validarSenha() {
  const valor = inputSenha.value;
  let tudoOk = true;

  itensRegras.forEach((item) => {
    const atendida = regras[item.dataset.regra](valor);
    atualizarItem(item, atendida);
    if (!atendida) tudoOk = false;
  });

  return tudoOk;
}


inputSenha.addEventListener('input', validarSenha);


form.addEventListener('submit', (evento) => {
  evento.preventDefault(); 

  
  if (!validarSenha()) {
    inputSenha.focus();
    return;
  }

  
  
  window.location.href = 'inicio.html';
});


validarSenha();
