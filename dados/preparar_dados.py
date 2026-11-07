"""
Prepara os dados do dashboard Open Finance Hub (A02).

Entradas (coloque na mesma pasta ou ajuste os caminhos):
  - laramee26openBankTransactionData.xlsx  (MoneyVis / Eurovis 2023, dados reais anonimizados, Reino Unido, em £)
  - Estatisticas_de_transações_Pix__1_.json (Banco Central do Brasil, Estatísticas de transações Pix, em R$)

Saídas:
  - transacoes.json  -> mes, ano, mes_original, tipo (entrada|saida), categoria, total, qtd
  - pix.json         -> mes, ano, valor, qtd, valor_bi, qtd_mi, ticket_medio

Uso:  pip install pandas openpyxl && python preparar_dados.py
"""
import datetime as dt
import json
import sys
from pathlib import Path

import pandas as pd

PASTA = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
XLSX = PASTA / "laramee26openBankTransactionData.xlsx"
PIX = PASTA / "Estatisticas_de_transações_Pix__1_.json"
SAIDA = Path(sys.argv[2]) if len(sys.argv) > 2 else PASTA

# Transações pontuais (compra/venda de imóvel: saída de £84.000 e entrada de £83.840,54)
# que distorcem a escala dos gráficos. Remova os números daqui para incluí-las.
EXCLUIR_TRANSACOES = {2713, 2718}

# Alinhamento de período com o Pix (jan/2024 a out/2026 = 34 meses).
# As transações reais cobrem 2015-07 a 2022-07; usamos os 34 meses mais recentes
# (2019-10 a 2022-07) e deslocamos as datas em +51 meses (2019-10 -> 2024-01, 2022-07 -> 2026-10).
# Os VALORES continuam reais; só o calendário é deslocado. O campo mes_original guarda o mês verdadeiro.
# Para usar o período original sem deslocar, coloque ALINHAR_AO_PIX = False.
ALINHAR_AO_PIX = True
JANELA_INICIO = "2019-10"
JANELA_FIM = "2022-07"
DESLOCAMENTO_MESES = 51

CATEGORIAS_PT = {
    "Savings": "Poupança",
    "Amazon": "Amazon",
    "Groceries": "Mercado",
    "Bills": "Contas",
    "Cash": "Saque em dinheiro",
    "Dine Out": "Restaurantes",
    "Supplementary Income": "Renda extra",
    "Travel": "Viagens",
    "Hotels": "Viagens",
    "Other Shopping": "Outras compras",
    "Services": "Serviços",
    "Entertainment": "Lazer",
    "Fitness": "Lazer",
    "Investment": "Investimentos",
    "Insurance": "Seguros",
    "Home Improvement": "Casa e reforma",
    "Paycheck": "Salário",
    "Interest": "Juros",
    "Clothes": "Roupas",
    "Mortgage": "Financiamento imobiliário",
}  # o que não estiver aqui (inclui vazio) vira "Outros"


def corrigir_data(v):
    """Células lidas como data pelo Excel estão com dia e mês trocados; as em texto são dd/mm/aaaa."""
    if isinstance(v, (dt.datetime, pd.Timestamp)):
        return pd.Timestamp(year=v.year, month=v.day, day=v.month)
    return pd.to_datetime(v, format="%d/%m/%Y")


def transacoes():
    df = pd.read_excel(XLSX, sheet_name=0)
    df = df[~df["Transaction Number"].isin(EXCLUIR_TRANSACOES)].copy()
    df["data"] = df["Transaction Date"].apply(corrigir_data)
    df["mes"] = df["data"].dt.strftime("%Y-%m")
    df["mes_original"] = df["mes"]
    if ALINHAR_AO_PIX:
        df = df[(df["mes"] >= JANELA_INICIO) & (df["mes"] <= JANELA_FIM)].copy()
        df["mes"] = (
            pd.PeriodIndex(df["mes"], freq="M") + DESLOCAMENTO_MESES
        ).strftime("%Y-%m")
    df["ano"] = df["mes"].str[:4].astype(int)
    cat = df["Category"].fillna("").str.strip()
    df["categoria"] = cat.map(CATEGORIAS_PT).fillna("Outros")

    saidas = df[df["Debit Amount"].notna()].assign(tipo="saida", valor=lambda d: d["Debit Amount"])
    entradas = df[df["Credit Amount"].notna()].assign(tipo="entrada", valor=lambda d: d["Credit Amount"])
    base = pd.concat([saidas, entradas])

    agg = (
        base.groupby(["mes", "ano", "mes_original", "tipo", "categoria"])["valor"]
        .agg(total="sum", qtd="count")
        .reset_index()
        .sort_values(["mes", "tipo", "categoria"])
    )
    agg["total"] = agg["total"].round(2)
    agg["ano"] = agg["ano"].astype(int)
    agg["qtd"] = agg["qtd"].astype(int)
    return agg


def pix():
    with open(PIX, encoding="utf-8") as f:
        linhas = json.load(f)["value"]
    df = pd.DataFrame(linhas)
    # O arquivo traz várias linhas por mês (quebras por dimensões que ficaram de fora da consulta);
    # somar por mês é o total correto.
    m = df.groupby("AnoMes").agg(valor=("VALOR", "sum"), qtd=("QUANTIDADE", "sum")).reset_index()
    m["mes"] = m["AnoMes"].astype(str).str[:4] + "-" + m["AnoMes"].astype(str).str[4:]
    m["ano"] = m["AnoMes"].astype(str).str[:4].astype(int)
    m["valor_bi"] = (m["valor"] / 1e9).round(2)
    m["qtd_mi"] = (m["qtd"] / 1e6).round(2)
    m["ticket_medio"] = (m["valor"] / m["qtd"]).round(2)
    m["valor"] = m["valor"].round(2)
    m["qtd"] = m["qtd"].astype(int)
    return m[["mes", "ano", "valor", "qtd", "valor_bi", "qtd_mi", "ticket_medio"]].sort_values("mes")


def salvar(df, nome):
    caminho = SAIDA / nome
    caminho.write_text(
        json.dumps(df.to_dict(orient="records"), ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{nome}: {len(df)} linhas, {caminho.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    salvar(transacoes(), "transacoes.json")
    salvar(pix(), "pix.json")
