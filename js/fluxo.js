  const SALDO_INICIAL = 3030;            
const INICIO = { ano: 2026, mes: 8 };  
const QTD_MESES = 7;                   

const recorrentes = [
  { nome: 'Salário · todo dia 10', valor: 5200 },
  { nome: 'Aluguel · todo dia 5',  valor: -1800 },
  { nome: 'Assinaturas · mensal',  valor: -180 },
];

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];


function moeda(n) {
  const numero = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '−' : ''}R$ ${numero}`;
}


const liquidoMensal = recorrentes.reduce((soma, r) => soma + r.valor, 0);

const pontos = Array.from({ length: QTD_MESES }, (_, i) => {
  const data = new Date(INICIO.ano, INICIO.mes + i, 1);
  return { rotulo: MESES[data.getMonth()], ano: data.getFullYear(), saldo: SALDO_INICIAL + liquidoMensal * i };
});
const ultimo = pontos[pontos.length - 1];


document.getElementById('flx-mes').textContent = `${ultimo.rotulo}/${ultimo.ano}`;
document.getElementById('flx-saldo').textContent = moeda(ultimo.saldo);


document.getElementById('flx-rec-lista').replaceChildren(...recorrentes.map((r) => {
  const li = document.createElement('li');
  const nome = document.createElement('span');
  const valor = document.createElement('strong');
  nome.textContent = r.nome;
  valor.textContent = (r.valor > 0 ? '+' : '') + moeda(r.valor);
  if (r.valor > 0) valor.className = 'is-pos';
  li.append(nome, valor);
  return li;
}));


const svg = document.getElementById('flx-chart');
const mobile = window.matchMedia('(max-width: 900px)');

function desenharGrafico() {
  const ehMobile = mobile.matches;

  /* Desktop: viewBox fixo e escalável. Mobile: 1 unidade = 1px (largura real do card),
     para linha, pontos e textos manterem o tamanho definido no Figma. */
  const W = ehMobile ? Math.round(svg.getBoundingClientRect().width) || 373 : 520;
  const H = ehMobile ? 173 : 200;
  const margem = ehMobile
    ? { esq: 14, dir: 19, topo: 33, base: 37 }
    : { esq: 16, dir: 24, topo: 16, base: 28 };
  const yRotulo = H - (ehMobile ? 11 : 8);

  const maximo = Math.max(...pontos.map((p) => p.saldo), 1);
  const x = (i) => margem.esq + ((W - margem.esq - margem.dir) * i) / (pontos.length - 1);
  const y = (v) => margem.topo + (H - margem.topo - margem.base) * (1 - Math.max(v, 0) / maximo);
  const yBase = H - margem.base;

  const coords = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.saldo).toFixed(1)}`);
  const area = `M${x(0)},${yBase} L${coords.join(' L')} L${x(pontos.length - 1)},${yBase} Z`;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML =
    `<path class="flx-chart__area" d="${area}"/>` +
    `<polyline class="flx-chart__linha" points="${coords.join(' ')}"/>` +
    pontos.map((p, i) =>
      `<circle class="flx-chart__ponto" cx="${x(i).toFixed(1)}" cy="${y(p.saldo).toFixed(1)}" r="4"/>` +
      `<text class="flx-chart__eixo" x="${x(i).toFixed(1)}" y="${yRotulo}" text-anchor="middle">${p.rotulo}</text>`
    ).join('');
}

desenharGrafico();
window.addEventListener('resize', desenharGrafico);


document.getElementById('flx-tabela').innerHTML =
  '<caption>Saldo projetado por mês</caption>' +
  '<tr><th scope="col">Mês</th><th scope="col">Saldo</th></tr>' +
  pontos.map((p) => `<tr><td>${p.rotulo}/${p.ano}</td><td>${moeda(p.saldo)}</td></tr>`).join('');
