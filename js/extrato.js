


const transacoes = [
  { desc: 'Supermercado Extra', inst: 'Nubank', cat: 'Alimentação', data: '2026-09-12', valor: -186.40 },
  { desc: 'Lanchonete Sabor',   inst: 'Inter',  cat: 'Alimentação', data: '2026-09-05', valor: -32.90 },
  { desc: 'Restaurante Maré',   inst: 'Nubank', cat: 'Alimentação', data: '2026-08-24', valor: -94.00 },
  { desc: 'Salário',            inst: 'Inter',  cat: 'Receita',     data: '2026-09-10', valor: 5200.00 },
  { desc: 'iFood',              inst: 'Nubank', cat: 'Alimentação', data: '2026-06-20', valor: -58.90 },
];

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const campos = {
  busca: document.getElementById('busca'),
  inst:  document.getElementById('instituicao'),
  cat:   document.getElementById('categoria'),
  de:    document.getElementById('de'),
  ate:   document.getElementById('ate'),
};



function rotuloMes(valor) {
  const [ano, mes] = valor.split('-');
  return `${MESES[Number(mes) - 1]}/${ano}`;
}


function dataBR(iso) {
  return iso.split('-').reverse().join('/');
}


function moeda(n) {
  const numero = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '−' : ''}R$ ${numero}`;
}


function textoPeriodo(de, ate) {
  if (de && ate) {
    const mesmoAno = de.slice(0, 4) === ate.slice(0, 4);
    return mesmoAno ? `${rotuloMes(de).split('/')[0]} a ${rotuloMes(ate)}` : `${rotuloMes(de)} a ${rotuloMes(ate)}`;
  }
  return de ? `A partir de ${rotuloMes(de)}` : `Até ${rotuloMes(ate)}`;
}


function atualizar() {
  const { busca, inst, cat, de, ate } = campos;
  const periodoInvalido = Boolean(de.value && ate.value && de.value > ate.value);

  
  [de, ate].forEach((campo) => campo.setAttribute('aria-invalid', String(periodoInvalido)));
  const erro = document.getElementById('erro-datas');
  erro.hidden = !periodoInvalido;
  if (periodoInvalido) {
    erro.textContent = `A data inicial (${rotuloMes(de.value)}) não pode ser depois da final (${rotuloMes(ate.value)}). Ajuste o período.`;
  }

  
  const termo = busca.value.trim().toLowerCase();
  const lista = periodoInvalido ? [] : transacoes.filter((t) => {
    const mes = t.data.slice(0, 7);
    return (!termo || t.desc.toLowerCase().includes(termo))
      && (!inst.value || t.inst === inst.value)
      && (!cat.value || t.cat === cat.value)
      && (!de.value || mes >= de.value)
      && (!ate.value || mes <= ate.value);
  });

  
  const tbody = document.getElementById('tx-linhas');
  tbody.replaceChildren();
  lista.forEach((t) => {
    const tr = document.createElement('tr');
    [t.desc, t.inst, t.cat, dataBR(t.data)].forEach((texto) => {
      const td = document.createElement('td');
      td.textContent = texto;
      tr.appendChild(td);
    });
    const tdValor = document.createElement('td');
    tdValor.className = 'tx__num tx__valor' + (t.valor > 0 ? ' tx__valor--pos' : '');
    tdValor.textContent = moeda(t.valor);
    tr.appendChild(tdValor);
    tbody.appendChild(tr);
  });

  
  document.getElementById('tx-tabela').hidden = lista.length === 0;
  document.getElementById('vazio').hidden = lista.length > 0;
  document.getElementById('vazio-texto').textContent = periodoInvalido
    ? 'Ajuste o período para ver resultados.'
    : 'Altere os filtros para ver resultados.';

  
  document.getElementById('total').textContent = moeda(lista.reduce((soma, t) => soma + t.valor, 0));

  
  const chips = [];
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
}


Object.values(campos).forEach((campo) => campo.addEventListener('input', atualizar));

document.getElementById('limpar').addEventListener('click', () => {
  Object.values(campos).forEach((campo) => { campo.value = ''; });
  atualizar();
  campos.busca.focus();
});


campos.de.value = '2026-01';
campos.ate.value = '2026-09';
atualizar();
