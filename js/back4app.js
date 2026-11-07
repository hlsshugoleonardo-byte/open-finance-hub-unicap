/* Cliente da API REST do Back4App para a classe Metas (CRUD).
   Campos: nome (String), valor (Number), mes (String, "AAAA-MM"). objectId e createdAt são do Parse.
   Todas as funções retornam Promise e lançam Error com mensagem em português se algo falhar. */
const OFH_METAS = (() => {
  const cfg = (window.OFH_CONFIG && window.OFH_CONFIG.back4app) || {};
  const configurado = Boolean(cfg.appId && cfg.restKey && !/COLE_AQUI/.test(cfg.appId + cfg.restKey));
  const base = `${cfg.url}/classes/Metas`;

  async function chamar(caminho, opcoes = {}) {
    if (!configurado) throw new Error('Back4App não configurado: preencha js/config.js.');
    let resp;
    try {
      resp = await fetch(base + caminho, {
        ...opcoes,
        headers: {
          'X-Parse-Application-Id': cfg.appId,
          'X-Parse-REST-API-Key': cfg.restKey,
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      throw new Error('Sem conexão com o servidor. Tente novamente.');
    }
    if (!resp.ok) {
      let detalhe = '';
      try { detalhe = (await resp.json()).error || ''; } catch (e) { /* sem corpo */ }
      throw new Error(`O servidor recusou a operação (${resp.status}). ${detalhe}`.trim());
    }
    return resp.json();
  }

  const paraMeta = (o) => ({ id: o.objectId, nome: o.nome, valor: Number(o.valor), mes: o.mes });

  return {
    configurado,
    // READ: todas as metas, da mais próxima para a mais distante
    async listar() {
      const dados = await chamar('?order=mes,createdAt&limit=100');
      return dados.results.map(paraMeta);
    },
    // CREATE
    async criar({ nome, valor, mes }) {
      return chamar('', { method: 'POST', body: JSON.stringify({ nome, valor, mes }) });
    },
    // UPDATE
    async editar(id, { nome, valor, mes }) {
      return chamar(`/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ nome, valor, mes }) });
    },
    // DELETE
    async excluir(id) {
      return chamar(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
})();
