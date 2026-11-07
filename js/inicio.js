/* Início: patrimônio, rosca (Chart.js), instituições e indicadores de mercado (API do Banco Central). */

const DETALHES = [
  // ordem e rótulos da legenda da rosca; "inst" liga cada fatia a uma instituição
  { rotulo: 'Investimentos',   inst: 'Inter',  cor: 'pri' },
  { rotulo: 'Contas',          inst: 'Nubank', cor: 'ok'  },
  { rotulo: 'Crédito (fatura)', inst: 'Itaú',  cor: 'bad' },
];

let rosca = null;

function renderizar() {
  const { instituicoes, saldos } = window.DADOS;
  const cores = OFH.cores();
  const ativas = instituicoes.filter((i) => OFH.conectada(i.id));
  const inativas = instituicoes.filter((i) => !OFH.conectada(i.id));

  /* --- Patrimônio total: soma só das instituições conectadas --- */
  const total = ativas.reduce((soma, i) => soma + saldos[i.id], 0);
  document.getElementById('total').textContent = OFH.moeda(total);

  const nomeNota = (i) => (i.id === 'Itaú' ? 'a fatura do Itaú' : `os dados do ${i.id}`);
  document.getElementById('total-nota').textContent = ativas.length === 0
    ? 'Nenhuma instituição conectada'
    : inativas.length ? `Sem ${inativas.map(nomeNota).join(' e ')} (desconectado)` : '';

  /* --- Legenda --- */
  const legenda = document.getElementById('legenda');
  legenda.replaceChildren(...DETALHES.map((d) => {
    const on = OFH.conectada(d.inst);
    const li = document.createElement('li');
    li.className = 'legend__item' + (on ? '' : ' is-off');
    li.innerHTML =
      `<span class="legend__dot legend__dot--${d.cor}" aria-hidden="true"></span>` +
      `<span class="legend__name"></span><span class="legend__value"></span>`;
    li.querySelector('.legend__name').textContent = d.rotulo;
    const valor = li.querySelector('.legend__value');
    if (on) {
      valor.textContent = OFH.moeda(saldos[d.inst]);
    } else {
      valor.innerHTML = '<span aria-hidden="true">—</span> <span class="legend__off">' + d.inst + ' desconectado</span>';
    }
    return li;
  }));

  /* --- Rosca (Chart.js): valor absoluto de cada fatia conectada --- */
  const fatias = DETALHES.filter((d) => OFH.conectada(d.inst));
  document.getElementById('donut-wrap').hidden = fatias.length === 0;
  document.getElementById('donut-vazio').hidden = fatias.length > 0;
  if (rosca) { rosca.destroy(); rosca = null; }
  if (fatias.length) {
    const soma = fatias.reduce((s, d) => s + Math.abs(saldos[d.inst]), 0);
    rosca = new Chart(document.getElementById('grafico-rosca'), {
      type: 'doughnut',
      data: {
        labels: fatias.map((d) => d.rotulo),
        datasets: [{
          data: fatias.map((d) => Math.abs(saldos[d.inst])),
          backgroundColor: fatias.map((d) => cores[d.cor]),
          borderColor: cores.sf,
          borderWidth: 2,
        }],
      },
      options: {
        cutout: '62%',
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const d = fatias[c.dataIndex];
                const pct = (Math.abs(saldos[d.inst]) / soma * 100).toFixed(1).replace('.', ',');
                return `${d.rotulo}: ${OFH.moeda(saldos[d.inst])} (${pct}% da composição)`;
              },
            },
          },
        },
      },
    });
    document.getElementById('grafico-rosca').setAttribute(
      'aria-label',
      'Gráfico de rosca: ' + fatias.map((d) =>
        `${d.rotulo.toLowerCase()} ${(Math.abs(saldos[d.inst]) / soma * 100).toFixed(0)}%`).join(', ')
    );
  }

  /* --- Cards por instituição --- */
  document.getElementById('inst-lista').replaceChildren(...instituicoes.map((i) => {
    const on = OFH.conectada(i.id);
    const li = document.createElement('li');
    li.innerHTML = `
      <article class="inst${on ? '' : ' inst--off'}">
        <span class="inst-logo inst-logo--${{ Nubank: 'nu', Inter: 'in', 'Itaú': 'it' }[i.id]}" aria-hidden="true">${i.sigla}</span>
        <div class="inst__info"><h3 class="inst__name"></h3><p class="inst__desc"></p></div>
        <div class="inst__balance"><p class="inst__value"></p><p class="inst__desc inst__papel"></p></div>
        <span class="badge ${on ? 'badge--on' : 'badge--off'}">${on ? 'Conectado' : 'Desconectado'}</span>
      </article>`;
    li.querySelector('.inst__name').textContent = i.id;
    li.querySelector('.inst__info .inst__desc').textContent = i.desc;
    li.querySelector('.inst__value').textContent = on ? OFH.moeda(saldos[i.id]) : '—';
    li.querySelector('.inst__papel').textContent = on ? i.papel : 'Sem dados';
    return li;
  }));
}

renderizar();
document.addEventListener('temamudou', renderizar);
window.addEventListener('pageshow', (e) => { if (e.persisted) renderizar(); }); // voltar pelo histórico

/* ---------- Mercado hoje: Selic e dólar (API de séries temporais do Banco Central) ---------- */
const BCB = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';
const INDICADORES = [
  { rotulo: 'Selic (meta, a.a.)', serie: 432, formato: (v) => `${v.toFixed(2).replace('.', ',')}%` },
  { rotulo: 'Dólar (venda)',      serie: 1,   formato: (v) => `R$ ${v.toFixed(4).replace('.', ',')}` },
];

async function buscarIndicador(ind) {
  const resp = await fetch(`${BCB}${ind.serie}/dados/ultimos/1?formato=json`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const [ponto] = await resp.json();
  const valor = Number(ponto && ponto.valor);
  if (!ponto || Number.isNaN(valor)) throw new Error('resposta vazia');
  return { ...ind, texto: ind.formato(valor), data: ponto.data };
}

async function carregarMercado() {
  const caixa = document.getElementById('mercado');
  try {
    const resultados = await Promise.all(INDICADORES.map(buscarIndicador));
    caixa.replaceChildren(...resultados.map((r) => {
      const div = document.createElement('div');
      div.className = 'mercado__item';
      div.innerHTML = '<p class="mercado__rotulo"></p><p class="mercado__valor"></p><p class="mercado__data"></p>';
      div.children[0].textContent = r.rotulo;
      div.children[1].textContent = r.texto;
      div.children[2].textContent = `Banco Central · ${r.data}`;
      return div;
    }));
  } catch (erro) {
    const p = document.createElement('p');
    p.className = 'mercado__msg';
    p.textContent = 'Não foi possível carregar Selic e dólar agora. Tente novamente mais tarde.';
    caixa.replaceChildren(p);
  }
}

carregarMercado();
