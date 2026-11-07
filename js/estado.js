/* Utilidades e estado compartilhado entre as telas (formatação, conexões, cores dos gráficos). */
const OFH = (() => {
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const CHAVE_CONEXOES = 'ofh.conexoes';
  const PADRAO_CONEXOES = { 'Nubank': true, 'Inter': true, 'Itaú': false };

  const moeda = (n) => {
    const numero = Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n < 0 ? '−' : ''}R$ ${numero}`;
  };

  // "Salário" -> "salario" (busca sem acento e sem diferença de maiúsculas)
  const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // "2026-09" -> "Set/2026"
  const rotuloMes = (mes) => {
    const [ano, m] = mes.split('-');
    return `${MESES[Number(m) - 1]}/${ano}`;
  };

  const somarMeses = (mes, n) => {
    const [ano, m] = mes.split('-').map(Number);
    const i = ano * 12 + (m - 1) + n;
    return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
  };

  // --- Conexões das instituições (salvas no navegador) ---
  const lerConexoes = () => {
    try {
      return { ...PADRAO_CONEXOES, ...JSON.parse(localStorage.getItem(CHAVE_CONEXOES) || '{}') };
    } catch (e) {
      return { ...PADRAO_CONEXOES };
    }
  };
  const conectada = (nome) => lerConexoes()[nome] === true;
  const definirConexao = (nome, valor) => {
    const atual = lerConexoes();
    atual[nome] = Boolean(valor);
    try { localStorage.setItem(CHAVE_CONEXOES, JSON.stringify(atual)); } catch (e) { /* ignora */ }
  };

  // Cores do tema atual, lidas do CSS (os gráficos usam isto e são redesenhados ao trocar o tema)
  const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const cores = () => ({
    pri: cor('--cor-pri'), pri2: cor('--cor-pri2'), btn: cor('--cor-btn'), ok: cor('--cor-ok'),
    bad: cor('--cor-bad'), wn: cor('--cor-wn'), tx: cor('--cor-tx'), mu: cor('--cor-mu'),
    ln: cor('--cor-ln'), sf: cor('--cor-sf'),
  });

  return { MESES, moeda, normalizar, rotuloMes, somarMeses, conectada, definirConexao, lerConexoes, cores };
})();
