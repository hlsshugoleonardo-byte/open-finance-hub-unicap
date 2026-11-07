/* Fluxo de caixa: projeção do saldo (Chart.js, linha) e card de Metas.
   Saldo inicial e recorrentes vêm da base (js/dados.js) e só contam instituições conectadas.
   O CRUD de Metas usa o Back4App (js/back4app.js, configurado em js/config.js). */

const { saldos, recorrentes: todosRecorrentes, meta: metaDados } = window.DADOS;
const MES_INICIO = metaDados.mesRef;      // primeiro ponto do gráfico (Set/2026)
let horizonte = 12;                        // quantidade de meses (pontos) mostrados
let metas = [];                            // preenchido por carregarMetas() (Back4App)
let grafico = null;

const botoes = document.querySelectorAll('.flx-chip');

function recorrentesAtivos() {
  return todosRecorrentes.filter((r) => OFH.conectada(r.inst));
}

function calcularPontos() {
  const saldoInicial = OFH.conectada('Nubank') ? saldos.Nubank : 0;
  const liquido = recorrentesAtivos().reduce((soma, r) => soma + r.valor, 0);
  return Array.from({ length: horizonte }, (_, i) => {
    const mes = OFH.somarMeses(MES_INICIO, i);
    return { mes, rotulo: OFH.rotuloMes(mes), saldo: Math.round((saldoInicial + liquido * i) * 100) / 100 };
  });
}

/* Linha tracejada da meta + rótulo "Meta: ..." (desenhado por plugin) */
const rotuloDaMeta = {
  id: 'rotuloDaMeta',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = OFH.cores().wn;
    ctx.textBaseline = 'bottom';
    const largura = chartArea.right - chartArea.left - 16;
    chart.data.datasets.slice(1).forEach((meta) => {
      if (!meta.data.length) return;
      const y = chart.scales.y.getPixelForValue(meta.data[0]);
      let texto = meta.rotulo || meta.label;
      while (texto.length > 4 && ctx.measureText(texto).width > largura) texto = texto.slice(0, -2).trimEnd() + '…';
      ctx.fillText(texto, chartArea.left + 8, y - 6);
    });
    ctx.restore();
  },
};

function renderizar() {
  const pontos = calcularPontos();
  const ultimo = pontos[pontos.length - 1];
  const cores = OFH.cores();

  document.getElementById('flx-mes').textContent = ultimo.rotulo;
  document.getElementById('flx-saldo').textContent = OFH.moeda(ultimo.saldo);

  /* recorrentes */
  const ativos = recorrentesAtivos();
  const lista = document.getElementById('flx-rec-lista');
  if (ativos.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nenhum recorrente: conecte o Nubank em Instituições.';
    lista.replaceChildren(li);
  } else {
    lista.replaceChildren(...ativos.map((r) => {
      const li = document.createElement('li');
      const nome = document.createElement('span');
      const valor = document.createElement('strong');
      nome.textContent = r.nome;
      valor.textContent = (r.valor > 0 ? '+' : '') + OFH.moeda(r.valor);
      if (r.valor > 0) valor.className = 'is-pos';
      li.append(nome, valor);
      return li;
    }));
  }
  const aviso = document.getElementById('flx-aviso');
  aviso.hidden = ativos.length > 0;
  aviso.textContent = 'Sem recorrentes, o saldo fica parado. Conecte o Nubank para projetar.';

  /* gráfico */
  const datasets = [{
    label: 'Saldo projetado',
    data: pontos.map((p) => p.saldo),
    borderColor: cores.pri,
    backgroundColor: cores.pri2,
    fill: 'origin',
    tension: 0,
    borderWidth: 2.5,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: cores.pri,
    pointBorderColor: cores.pri,
  }];
  metas.forEach((m) => {
    datasets.push({
      label: `Meta ${m.nome}: ${OFH.moeda(m.valor)}`,
      rotulo: `${m.nome}: ${OFH.moeda(m.valor)}`,
      data: pontos.map(() => m.valor),
      borderColor: cores.wn,
      borderDash: [6, 5],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    });
  });

  if (grafico) { grafico.destroy(); grafico = null; }
  grafico = new Chart(document.getElementById('grafico-linha'), {
    type: 'line',
    data: { labels: pontos.map((p) => p.rotulo.split('/')[0]), datasets },
    options: {
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (itens) => pontos[itens[0].dataIndex].rotulo,
            label: (c) => `${c.dataset.label.startsWith('Meta ') ? c.dataset.label : 'Saldo: ' + OFH.moeda(c.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Mês', color: cores.mu, font: { size: 12 } }, grid: { display: false }, ticks: { color: cores.mu, font: { size: 12 }, maxRotation: 0, autoSkipPadding: 6 }, border: { color: cores.ln } },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Saldo projetado (R$)', color: cores.mu, font: { size: 12 } },
          grid: { color: cores.ln },
          border: { display: false },
          ticks: { color: cores.mu, font: { size: 11 }, callback: (v) => v.toLocaleString('pt-BR') },
        },
      },
    },
    plugins: [rotuloDaMeta],
  });
  document.getElementById('grafico-linha').setAttribute(
    'aria-label',
    `Gráfico de linha do saldo projetado de ${pontos[0].rotulo} a ${ultimo.rotulo}, chegando a ${OFH.moeda(ultimo.saldo)}` +
    (metas.length ? `. Metas: ${metas.map((m) => `${m.nome} ${OFH.moeda(m.valor)}`).join(', ')}` : '')
  );

  document.getElementById('flx-tabela').innerHTML =
    '<caption>Saldo projetado por mês</caption>' +
    '<tr><th scope="col">Mês</th><th scope="col">Saldo</th></tr>' +
    pontos.map((p) => `<tr><td>${p.rotulo}</td><td>${OFH.moeda(p.saldo)}</td></tr>`).join('');
}

/* ---------- Botões 3 / 6 / 12 meses ---------- */
botoes.forEach((b) => b.addEventListener('click', () => {
  horizonte = Number(b.dataset.meses);
  botoes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderizar();
}));

/* ---------- Card de Metas (CRUD no Back4App) ---------- */
const form = document.getElementById('form-meta');
const erro = document.getElementById('meta-erro');
const listaMetas = document.getElementById('metas-lista');
const statusEl = document.getElementById('metas-status');
const btnEnviar = document.getElementById('meta-enviar');

function mostrarErro(texto) {
  erro.textContent = texto;
  erro.hidden = !texto;
}

function mostrarStatus(texto) {
  statusEl.textContent = texto;
  statusEl.hidden = !texto;
}

function lerValor(texto) {
  const n = Number(texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

/* Valida os três campos e devolve { nome, valor, mes } ou { erro } */
function lerCampos(nomeEl, valorEl, mesEl) {
  const nome = nomeEl.value.trim();
  const valor = lerValor(valorEl.value);
  const mes = mesEl.value.trim();
  if (!nome) return { erro: 'Informe o nome da meta.' };
  if (!(valor > 0)) return { erro: 'Informe um valor maior que zero.' };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return { erro: 'Informe o mês (ex.: 2027-03).' };
  return { nome, valor, mes };
}

/* READ: busca as metas no back-end e redesenha lista + gráfico */
async function carregarMetas() {
  if (!OFH_METAS.configurado) {
    mostrarStatus('Back4App não configurado: preencha js/config.js para salvar metas.');
    return;
  }
  try {
    renderMetas(await OFH_METAS.listar());
    mostrarStatus('');
  } catch (e) {
    mostrarStatus(e.message);
  }
}

function renderMetas(lista) {
  metas = Array.isArray(lista) ? lista : [];
  listaMetas.replaceChildren(...metas.map((m) => {
    const li = document.createElement('li');
    li.className = 'metas-item';
    li.innerHTML = '<span class="metas-item__texto"></span><button type="button" class="flx-mini">Editar</button><button type="button" class="flx-mini flx-mini--bad">Excluir</button>';
    li.querySelector('.metas-item__texto').textContent = `${m.nome} · ${OFH.moeda(m.valor)} · ${OFH.rotuloMes(m.mes)}`;
    const [editar, excluir] = li.querySelectorAll('button');
    editar.setAttribute('aria-label', `Editar meta ${m.nome}`);
    excluir.setAttribute('aria-label', `Excluir meta ${m.nome}`);
    editar.addEventListener('click', () => abrirEditar(m, editar));
    excluir.addEventListener('click', () => abrirExcluir(m, excluir));
    return li;
  }));
  renderizar();
}

/* CREATE */
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const dados = lerCampos(form.querySelector('#meta-nome'), form.querySelector('#meta-valor'), form.querySelector('#meta-mes'));
  if (dados.erro) return mostrarErro(dados.erro);
  mostrarErro('');
  btnEnviar.disabled = true;
  try {
    await OFH_METAS.criar(dados);
    form.reset();
    await carregarMetas();
    mostrarStatus('Meta adicionada.');
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    btnEnviar.disabled = false;
  }
});

/* ---------- Modais (editar e excluir) ---------- */
let origemFoco = null;
let abertoAtual = null;

function abrirModal(modal, foco, origem) {
  origemFoco = origem;
  abertoAtual = modal;
  modal.classList.remove('hidden');
  foco.focus();
}
function fecharModal() {
  if (!abertoAtual) return;
  abertoAtual.classList.add('hidden');
  abertoAtual = null;
  if (origemFoco && document.contains(origemFoco)) origemFoco.focus();
}
document.addEventListener('keydown', (e) => {
  if (!abertoAtual) return;
  if (e.key === 'Escape') { fecharModal(); return; }
  if (e.key !== 'Tab') return;
  // foco preso dentro do modal
  const itens = [...abertoAtual.querySelectorAll('input, button')].filter((el) => !el.disabled);
  const primeiro = itens[0], ultimo = itens[itens.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
});
document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) fecharModal(); }));

/* UPDATE */
const modalEditar = document.getElementById('modal-editar');
const formEditar = document.getElementById('form-editar');
const editarErro = document.getElementById('editar-erro');
const campoNome = document.getElementById('editar-nome');
const campoValor = document.getElementById('editar-valor');
const campoMes = document.getElementById('editar-mes');
const btnSalvar = document.getElementById('editar-salvar');
let metaEditando = null;

function abrirEditar(meta, origem) {
  metaEditando = meta;
  campoNome.value = meta.nome;
  campoValor.value = meta.valor.toFixed(2).replace('.', ',');
  campoMes.value = meta.mes;
  editarErro.hidden = true;
  abrirModal(modalEditar, campoNome, origem);
}
document.getElementById('editar-cancelar').addEventListener('click', fecharModal);
formEditar.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const dados = lerCampos(campoNome, campoValor, campoMes);
  if (dados.erro) { editarErro.textContent = dados.erro; editarErro.hidden = false; return; }
  editarErro.hidden = true;
  btnSalvar.disabled = true;
  try {
    await OFH_METAS.editar(metaEditando.id, dados);
    fecharModal();
    await carregarMetas();
    mostrarStatus('Meta atualizada.');
  } catch (e) {
    editarErro.textContent = e.message;
    editarErro.hidden = false;
  } finally {
    btnSalvar.disabled = false;
  }
});

/* DELETE (com confirmação) */
const modalExcluir = document.getElementById('modal-excluir');
const btnExcluir = document.getElementById('excluir-confirmar');
let metaExcluindo = null;

function abrirExcluir(meta, origem) {
  metaExcluindo = meta;
  document.getElementById('excluir-titulo').textContent = `Excluir a meta "${meta.nome}"?`;
  abrirModal(modalExcluir, document.getElementById('excluir-cancelar'), origem);
}
document.getElementById('excluir-cancelar').addEventListener('click', fecharModal);
btnExcluir.addEventListener('click', async () => {
  btnExcluir.disabled = true;
  try {
    await OFH_METAS.excluir(metaExcluindo.id);
    origemFoco = null; // o botão que abriu o modal deixa de existir
    fecharModal();
    await carregarMetas();
    mostrarStatus('Meta excluída.');
  } catch (e) {
    fecharModal();
    mostrarStatus(e.message);
  } finally {
    btnExcluir.disabled = false;
  }
});

document.addEventListener('temamudou', renderizar);
window.addEventListener('pageshow', (e) => { if (e.persisted) renderizar(); });
renderizar();
carregarMetas();
