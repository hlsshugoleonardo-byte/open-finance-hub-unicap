"""
Gera js/dados.js (camada de dados do front) a partir de dados/transacoes.json.

transacoes.json vem de preparar_dados.py (base real agregada por mês, tipo e categoria).
Este script NÃO inventa valores: só agrupa, soma e atribui cada categoria a uma instituição
por um mapeamento fixo (a base não traz instituição). As regras ficam no topo, em um lugar só.

Uso:  python3 dados/gerar_dados.py
"""
import json
import math
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "dados" / "transacoes.json"
SAIDA = RAIZ / "js" / "dados.js"

# Mês de referência do painel ("hoje" do protótipo). Outubro/2026 na base é um mês parcial.
MES_REF = "2026-09"
MESES_RECORRENTES = 12  # janela da média usada nos recorrentes do Fluxo

# Instituição de cada categoria (a base não informa). Categoria fora da lista vai para o Nubank.
INSTITUICAO_DA_CATEGORIA = {
    # Inter: dinheiro que sai da conta para investir
    "Investimentos": "Inter",
    "Poupança": "Inter",
    # Itaú: gastos no cartão de crédito (viram a fatura)
    "Amazon": "Itaú",
    "Restaurantes": "Itaú",
    "Viagens": "Itaú",
    "Outras compras": "Itaú",
    "Lazer": "Itaú",
    "Roupas": "Itaú",
}
PADRAO = "Nubank"  # conta corrente: salário, contas, mercado, serviços, casa etc.

INSTITUICOES = [
    {"id": "Nubank", "sigla": "Nu", "desc": "Conta + cartão", "papel": "Conta"},
    {"id": "Inter", "sigla": "In", "desc": "Investimentos", "papel": "Investimento"},
    {"id": "Itaú", "sigla": "It", "desc": "Fatura do cartão", "papel": "Crédito"},
]

# Recorrentes do Fluxo: categoria, sinal, rótulo. O valor é a média mensal real dos últimos 12 meses.
RECORRENTES = [
    {"tipo": "entrada", "categoria": "Salário", "rotulo": "Salário · mensal"},
    {"tipo": "saida", "categoria": "Contas", "rotulo": "Contas · média mensal"},
    {"tipo": "saida", "categoria": "Serviços", "rotulo": "Serviços · média mensal"},
]
# Cada recorrente pertence à instituição da sua categoria (todas Nubank hoje).

MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def inst_da(cat):
    return INSTITUICAO_DA_CATEGORIA.get(cat, PADRAO)


def deslocar(mes, n):
    ano, m = map(int, mes.split("-"))
    idx = ano * 12 + (m - 1) + n
    return f"{idx // 12}-{idx % 12 + 1:02d}"


def main():
    base = json.loads(ENTRADA.read_text(encoding="utf-8"))

    linhas = []
    for r in sorted(base, key=lambda r: (r["mes"], r["tipo"], r["categoria"])):
        sinal = 1 if r["tipo"] == "entrada" else -1
        linhas.append({
            "mes": r["mes"],
            "tipo": r["tipo"],
            "cat": r["categoria"],
            "inst": inst_da(r["categoria"]),
            "valor": round(sinal * r["total"], 2),
            "qtd": r["qtd"],
        })

    ate_ref = [l for l in linhas if l["mes"] <= MES_REF]

    # --- Investimentos (Inter): tudo que a conta enviou para investir/poupar até o mês de referência
    investimentos = round(-sum(l["valor"] for l in ate_ref if l["inst"] == "Inter"), 2)

    # --- Crédito (Itaú): fatura aberta = gastos no cartão do mês de referência
    fatura = round(-sum(l["valor"] for l in ate_ref if l["inst"] == "Itaú" and l["mes"] == MES_REF), 2)

    # --- Conta (Nubank): saldo = abertura + entradas - saídas, com a fatura aberta ainda não paga.
    # A base começa sem saldo de abertura, então usamos o menor valor que impede a conta de
    # ficar negativa em qualquer mês (arredondado para cima em R$ 100).
    por_mes = defaultdict(float)
    for l in ate_ref:
        por_mes[l["mes"]] += l["valor"]
    acum, menor = 0.0, 0.0
    for mes in sorted(por_mes):
        acum += por_mes[mes]
        menor = min(menor, acum)
    abertura = math.ceil(-menor / 100) * 100
    saldo_conta = round(abertura + acum + fatura, 2)

    # --- Recorrentes: média mensal real dos últimos MESES_RECORRENTES meses fechados
    janela = [deslocar(MES_REF, -i) for i in range(MESES_RECORRENTES)]
    recorrentes = []
    for rec in RECORRENTES:
        soma = sum(l["valor"] for l in linhas
                   if l["mes"] in janela and l["tipo"] == rec["tipo"] and l["cat"] == rec["categoria"])
        recorrentes.append({
            "nome": rec["rotulo"],
            "valor": round(soma / MESES_RECORRENTES, 2),
            "inst": inst_da(rec["categoria"]),
        })

    dados = {
        "meta": {
            "mesRef": MES_REF,
            "janelaRecorrentes": [janela[-1], janela[0]],
            "aberturaConta": abertura,
            "fonte": "MoneyVis / EuroVis 2023 (dados reais anonimizados), calendário alinhado ao Pix",
        },
        "instituicoes": INSTITUICOES,
        "saldos": {"Nubank": saldo_conta, "Inter": investimentos, "Itaú": -fatura},
        "linhas": linhas,
        "recorrentes": recorrentes,
    }

    SAIDA.write_text(
        "/* Gerado por dados/gerar_dados.py. Não edite à mão. */\n"
        "window.DADOS = " + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{SAIDA.relative_to(RAIZ)}: {len(linhas)} linhas, {SAIDA.stat().st_size / 1024:.1f} KB")
    print("abertura da conta:", abertura)
    print("saldos:", dados["saldos"])
    print("total com tudo:", round(sum(dados["saldos"].values()), 2))
    print("recorrentes:", recorrentes)


if __name__ == "__main__":
    main()
