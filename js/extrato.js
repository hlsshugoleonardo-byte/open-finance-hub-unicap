/* Extrato: filtros + tabela + gráfico de barras (Chart.js) que acompanha os filtros.
   Os dados vêm de js/dados.js (gerado de dados/transacoes.json). */

const { linhas, instituicoes } = window.DADOS;

const SEM_GASTO = new Set(['Investimentos', 'Poupança']); // dinheiro movido para a Inter, não é gasto
const MAX_BARRAS = 6;

const campos = {
  busca: document.getElementById('busca'),
  inst:  document.getElementById('instituicao'),
  cat:   document.getElementById('categoria'),
  de:    document.getElementById('de'),
  ate:   document.getElementById('ate'),
};

let grafico = null;
const estreito = window.matchMedia('(max-width: 700px)'); // celular: barras na horizontal

/* ---------- Preenche os selects ---------- */
function montarSelects() {
  const valorInst = campos.inst.value;
  campos.inst.replaceChildren(new Option('Instituição', ''));
  instituicoes.forEach((i) => {
    const on = OFH.conectada(i.id);
    const opt = new Option(on ? i.id : `${i.id} (desconectado)`, i.id);
    opt.disabled = !on;
    campos.inst.appendChild(opt);
  });
  campos.inst.value = OFH.conectada(valorInst) ? valorInst : '';

  const valorCat = campos.cat.value;
  campos.cat.replaceChildren(new Option('Categoria', ''));
  [...new Set(linhas.map((l) => l.cat))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .forEach((c) => campos.cat.appendChild(new Option(c, c)));
  campos.cat.value = valorCat;
}

/* ---------- Textos auxiliares ---------- */
const dataBR = (mes) => mes.split('-').reverse().join('/'); // "2026-09" -> "09/2026"

function textoPeriodo(de, ate) {
  if (de && ate) {
    const mesmoAno = de.slice(0, 4) === ate.slice(0, 4);
    return mesmoAno ? `${OFH.rotuloMes(de).split('/')[0]} a ${OFH.rotuloMes(ate)}` : `${OFH.rotuloMes(de)} a ${OFH.rotuloMes(ate)}`;
  }
  return de ? `A partir de ${OFH.rotuloMes(de)}` : `Até ${OFH.rotuloMes(ate)}`;
}

const descricao = (l) => `${l.cat} · ${l.qtd} ${l.qtd === 1 ? 'transação' : 'transações'}`;

/* ---------- Gráfico de barras: gastos por categoria ---------- */
const rotulosNasBarras = {
  id: 'rotulosNasBarras',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const cores = OFH.cores();
    ctx.save();
    ctx.font = '800 12px Inter, sans-serif';
    ctx.fillStyle = cores.tx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const horizontal = chart.options.indexAxis === 'y';
    if (horizontal) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; }
    chart.getDatasetMeta(0).data.forEach((barra, i) => {
      const texto = OFH.moeda(chart.data.datasets[0].data[i]);
      if (horizontal) {
        // sem espaço à direita da barra: escreve o valor dentro dela
        if (barra.x + 6 + ctx.measureText(texto).width > chart.width - 4) {
          ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
          ctx.fillText(texto, barra.x - 8, barra.y);
          ctx.textAlign = 'left'; ctx.fillStyle = cores.tx;
        } else {
          ctx.fillText(texto, barra.x + 6, barra.y);
        }
      }
      else ctx.fillText(texto, barra.x, barra.y - 4);
    });
    ctx.restore();
  },
};

function desenharGrafico(lista) {
  const gastos = new Map();
  lista.filter((l) => l.valor < 0 && !SEM_GASTO.has(l.cat))
    .forEach((l) => gastos.set(l.cat, (gastos.get(l.cat) || 0) + -l.valor));

  let itens = [...gastos].map(([cat, v]) => [cat, Math.round(v * 100) / 100]).sort((a, b) => b[1] - a[1]);
  if (itens.length > MAX_BARRAS) {
    const resto = itens.slice(MAX_BARRAS - 1);
    itens = itens.slice(0, MAX_BARRAS - 1)
      .concat([[`Demais (${resto.length})`, Math.round(resto.reduce((s, [, v]) => s + v, 0) * 100) / 100]]);
  }

  const vazio = itens.length === 0;
  document.getElementById('xtr-area').hidden = vazio;
  document.getElementById('xtr-vazio').hidden = !vazio;
  if (grafico) { grafico.destroy(); grafico = null; }

  document.getElementById('xtr-tabela-acess').innerHTML =
    '<caption>Gastos por categoria</caption><tr><th scope="col">Categoria</th><th scope="col">Gasto</th></tr>' +
    itens.map(([c, v]) => `<tr><td>${c}</td><td>${OFH.moeda(v)}</td></tr>`).join('');
  if (vazio) return;

  const cores = OFH.cores();
  const horizontal = estreito.matches;
  document.getElementById('xtr-area').style.height = horizontal ? `${60 + itens.length * 40}px` : '';
  const eixoCategoria = { title: { display: true, text: 'Categoria', color: cores.mu, font: { size: 12 } }, grid: { display: false }, ticks: { color: cores.tx, font: { size: 12 } }, border: { color: cores.ln } };
  const eixoValor = {
    beginAtZero: true,
    grace: 0,
    title: { display: true, text: 'Gasto (R$)', color: cores.mu, font: { size: 12 } },
    grid: { color: cores.ln },
    border: { display: false },
    ticks: { color: cores.mu, font: { size: 11 }, maxTicksLimit: horizontal ? 4 : 8, callback: (v) => v.toLocaleString('pt-BR') },
  };
  grafico = new Chart(document.getElementById('grafico-barras'), {
    type: 'bar',
    data: {
      labels: itens.map(([c]) => c),
      datasets: [{
        label: 'Gasto (R$)',
        data: itens.map(([, v]) => v),
        backgroundColor: cores.btn,
        borderRadius: 8,
        maxBarThickness: 96,
      }],
    },
    options: {
      maintainAspectRatio: false,
      animation: { duration: 250 },
      indexAxis: horizontal ? 'y' : 'x',
      layout: { padding: horizontal ? { right: 8 } : { top: 22 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `Gasto: ${OFH.moeda(horizontal ? c.parsed.x : c.parsed.y)}` } },
      },
      scales: horizontal ? { y: eixoCategoria, x: eixoValor } : { x: eixoCategoria, y: eixoValor },
    },
    plugins: [rotulosNasBarras],
  });
  document.getElementById('grafico-barras').setAttribute(
    'aria-label',
    'Gráfico de barras dos gastos por categoria: ' + itens.map(([c, v]) => `${c} ${OFH.moeda(v)}`).join(', ')
  );
}

/* ---------- Atualização geral ---------- */
function atualizar() {
  const { busca, inst, cat, de, ate } = campos;
  const periodoInvalido = Boolean(de.value && ate.value && de.value > ate.value);

  [de, ate].forEach((campo) => campo.setAttribute('aria-invalid', String(periodoInvalido)));
  const erro = document.getElementById('erro-datas');
  erro.hidden = !periodoInvalido;
  if (periodoInvalido) {
    erro.textContent = `A data inicial (${OFH.rotuloMes(de.value)}) não pode ser depois da final (${OFH.rotuloMes(ate.value)}). Ajuste o período.`;
  }

  const termo = OFH.normalizar(busca.value.trim());
  const dica = document.getElementById('dica-busca');
  dica.hidden = !termo;
  if (termo) dica.textContent = `A busca ignora acentos: "${busca.value.trim()}" também encontra variações com acento.`;

  const lista = periodoInvalido ? [] : linhas
    .filter((l) => OFH.conectada(l.inst))
    .filter((l) => (!termo || OFH.normalizar(descricao(l)).includes(termo))
      && (!inst.value || l.inst === inst.value)
      && (!cat.value || l.cat === cat.value)
      && (!de.value || l.mes >= de.value)
      && (!ate.value || l.mes <= ate.value))
    .sort((a, b) => b.mes.localeCompare(a.mes) || Math.abs(b.valor) - Math.abs(a.valor));

  /* tabela */
  const tbody = document.getElementById('tx-linhas');
  tbody.replaceChildren(...lista.map((l) => {
    const tr = document.createElement('tr');
    [descricao(l), l.inst, l.cat, dataBR(l.mes)].forEach((texto) => {
      const td = document.createElement('td');
      td.textContent = texto;
      tr.appendChild(td);
    });
    const tdValor = document.createElement('td');
    tdValor.className = 'tx__num tx__valor' + (l.valor > 0 ? ' tx__valor--pos' : '');
    tdValor.textContent = OFH.moeda(l.valor);
    tr.appendChild(tdValor);
    return tr;
  }));

  document.getElementById('tx-tabela').hidden = lista.length === 0;
  document.getElementById('vazio').hidden = lista.length > 0;
  document.getElementById('vazio-texto').textContent = periodoInvalido
    ? 'Ajuste o período para ver resultados.'
    : 'Altere os filtros para ver resultados.';

  document.getElementById('total').textContent = OFH.moeda(lista.reduce((soma, l) => soma + l.valor, 0));

  /* chips */
  const chips = [];
  if (termo) chips.push(`Busca: ${busca.value.trim()}`);
  if (inst.value) chips.push(inst.value);
  if (cat.value) chips.push(cat.value);
  if (de.value || ate.value) chips.push(textoPeriodo(de.value, ate.value));

  document.getElementById('chips').replaceChildren(...chips.map((texto) => {
    const li = document.createElement('li');
    li.className = 'chip';
    li.textContent = texto;
    return li;
  }));
  document.getElementById('aplicados').hidden = chips.length === 0;

  desenharGrafico(lista);
}

Object.values(campos).forEach((campo) => campo.addEventListener('input', atualizar));

document.getElementById('limpar').addEventListener('click', () => {
  Object.values(campos).forEach((campo) => { campo.value = ''; });
  atualizar();
  campos.busca.focus();
});

document.addEventListener('temamudou', atualizar);
estreito.addEventListener('change', atualizar);
window.addEventListener('pageshow', (e) => { if (e.persisted) { montarSelects(); atualizar(); } });

montarSelects();
campos.de.value = '2026-01';
campos.ate.value = '2026-09';
atualizar();
