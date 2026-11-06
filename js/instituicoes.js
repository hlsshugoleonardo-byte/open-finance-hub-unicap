

const lista = document.getElementById('lista-instituicoes');
const aviso = document.getElementById('aviso-status');


function atualizarCard(card, conectado) {
  const nome  = card.dataset.nome;
  const badge = card.querySelector('.badge');
  const desc  = card.querySelector('.conn__desc');
  const botao = card.querySelector('.conn__btn');

  
  card.classList.toggle('conn--on', conectado);
  card.classList.toggle('conn--off', !conectado);

  
  badge.classList.toggle('badge--on', conectado);
  badge.classList.toggle('badge--off', !conectado);
  badge.textContent = conectado ? 'Conectado' : 'Desconectado';

  
  desc.textContent = conectado ? 'Dados compartilhados' : 'Sem compartilhamento';

  
  botao.classList.toggle('conn__btn--outline', conectado);
  botao.classList.toggle('conn__btn--solid', !conectado);
  botao.textContent = conectado ? 'Revogar acesso' : 'Conectar';

  
  botao.setAttribute('aria-label', `${botao.textContent} ${nome}`);

  
  aviso.textContent = conectado
    ? `${nome} conectado. Dados compartilhados.`
    : `Acesso do ${nome} revogado. Sem compartilhamento.`;
}


const modal        = document.getElementById('modal-revogar');
const modalTitulo  = document.getElementById('modal-titulo');
const btnVoltar    = document.getElementById('modal-voltar');
const btnConfirmar = document.getElementById('modal-confirmar');

let cardAlvo = null;     
let botaoOrigem = null;  

function abrirModal(card, botao) {
  cardAlvo = card;
  botaoOrigem = botao;

  
  modalTitulo.textContent = `Revogar acesso ao ${card.dataset.nome}?`;

  modal.classList.remove('hidden');
  btnVoltar.focus();
}

function fecharModal() {
  modal.classList.add('hidden');
  if (botaoOrigem) botaoOrigem.focus();
  cardAlvo = null;
  botaoOrigem = null;
}


lista.addEventListener('click', (evento) => {
  const botao = evento.target.closest('.conn__btn');
  if (!botao) return;

  const card = botao.closest('.conn');

  if (card.classList.contains('conn--on')) {
    abrirModal(card, botao);        
  } else {
      abrirModalConectar(card, botao); 
  }
});


btnVoltar.addEventListener('click', fecharModal);


modal.addEventListener('click', (evento) => {
  if (evento.target === modal) fecharModal();
});


btnConfirmar.addEventListener('click', () => {
  const card = cardAlvo;
  fecharModal();
  atualizarCard(card, false);
});


document.addEventListener('keydown', (evento) => {
  if (modal.classList.contains('hidden')) return;

  if (evento.key === 'Escape') fecharModal();

  if (evento.key === 'Tab') {
    if (evento.shiftKey && document.activeElement === btnVoltar) {
      evento.preventDefault();
      btnConfirmar.focus();
    } else if (!evento.shiftKey && document.activeElement === btnConfirmar) {
      evento.preventDefault();
      btnVoltar.focus();
    }
  }
});




const modalConectar     = document.getElementById('modal-conectar');
const conectarNome      = document.getElementById('modal-conectar-instituicao');
const btnConectarVoltar = document.getElementById('modal-conectar-voltar');
const btnConectarOk     = document.getElementById('modal-conectar-confirmar');

let cardConectar = null;     
let botaoConectar = null;    

function abrirModalConectar(card, botao) {
  cardConectar = card;
  botaoConectar = botao;

  
  conectarNome.textContent = card.dataset.nome;

  modalConectar.classList.remove('hidden');
  btnConectarVoltar.focus();
}

function fecharModalConectar() {
  modalConectar.classList.add('hidden');
  if (botaoConectar) botaoConectar.focus();
  cardConectar = null;
  botaoConectar = null;
}


btnConectarVoltar.addEventListener('click', fecharModalConectar);


modalConectar.addEventListener('click', (evento) => {
  if (evento.target === modalConectar) fecharModalConectar();
});


btnConectarOk.addEventListener('click', () => {
  const card = cardConectar;
  fecharModalConectar();
  atualizarCard(card, true);
});


document.addEventListener('keydown', (evento) => {
  if (modalConectar.classList.contains('hidden')) return;

  if (evento.key === 'Escape') fecharModalConectar();

  if (evento.key === 'Tab') {
    if (evento.shiftKey && document.activeElement === btnConectarVoltar) {
      evento.preventDefault();
      btnConectarOk.focus();
    } else if (!evento.shiftKey && document.activeElement === btnConectarOk) {
      evento.preventDefault();
      btnConectarVoltar.focus();
    }
  }
});


document.querySelectorAll('.conn').forEach((card) => {
  const botao = card.querySelector('.conn__btn');
  botao.setAttribute('aria-label', `${botao.textContent} ${card.dataset.nome}`);
});
