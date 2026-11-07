# Open Finance Hub

Protótipo front-end de um hub financeiro baseado em Open Finance: reúne contas, cartões e investimentos de várias instituições em um só lugar, com filtros, contexto e confirmações claras a cada ação.

**Demo:** https://open-finance-hub-unicap.onrender.com

**Repositório:** https://github.com/hlsshugoleonardo-byte/open-finance-hub-unicap

> Projeto estático em HTML, CSS e JavaScript, com gráficos em Chart.js. Os dados vêm de uma base real anonimizada (`dados/`) e não há autenticação real.

## Telas

| Tela | Arquivo | O que faz |
| --- | --- | --- |
| Login | `index.html` | Formulário de acesso com validação da senha em tempo real, botão mostrar/ocultar senha e botão de modo escuro. |
| Início | `inicio.html` | Patrimônio total, **gráfico de rosca (Chart.js)** da composição, saldo por instituição com selo de conexão e o card **Mercado hoje** (Selic e dólar, API do Banco Central). |
| Instituições | `instituicoes.html` | Conectar e revogar o compartilhamento de dados, sempre com modal de confirmação. O estado é salvo e alimenta as outras telas. |
| Extrato | `extrato.html` | **Gráfico de barras (Chart.js)** de gastos por categoria que acompanha os filtros, busca sem acento, filtros de instituição, categoria e período, chips e total. |
| Fluxo de caixa | `fluxo.html` | **Gráfico de linha (Chart.js)** do saldo projetado (3, 6 ou 12 meses), recorrentes calculados da base e card de **Metas** com CRUD completo no Back4App (as metas viram linhas tracejadas no gráfico). |

## Dados

> **Sobre a origem dos dados (leia antes de avaliar os números).** Os valores são reais, mas a base passou por três adaptações para caber no tema do projeto:
>
> 1. **Moeda:** a base original (MoneyVis / EuroVis 2023, dados bancários reais e anonimizados) é do **Reino Unido e está em libras (£)**. O site exibe os valores com o símbolo **R$**, **sem conversão cambial**: o número é o mesmo da base, só o rótulo da moeda mudou. Trate os valores como ilustrativos em reais, não como câmbio.
> 2. **Calendário ajustado:** as transações reais cobrem **2019-10 a 2022-07**. Para alinhar o período ao do Pix e ao "hoje" do protótipo, as datas foram **deslocadas em +51 meses** (2019-10 vira 2024-01 e 2022-07 vira 2026-10). Só o calendário muda; os valores e a ordem dos meses são os originais. O mês verdadeiro de cada linha está no campo `mes_original` de `dados/transacoes.json`. Para usar as datas originais, defina `ALINHAR_AO_PIX = False` em `dados/preparar_dados.py` e rode os dois scripts de novo.
> 3. **Modelagem:** a base **não informa a instituição**. A atribuição de categorias a Nubank, Inter e Itaú é um mapeamento fixo nosso, e o saldo de abertura da conta (R$ 5.300) é o menor valor que impede o saldo de ficar negativo (a base não traz saldo inicial). Duas transações pontuais de compra e venda de imóvel (£ 84.000 e £ 83.840,54) foram excluídas por distorcerem a escala.
>
> Nada foi inventado: todo valor exibido é soma, média ou contagem de linhas da base real. O que é nosso são o rótulo de moeda, o calendário deslocado e a divisão por instituição.

Todos os valores vêm de `dados/transacoes.json` (base real agregada por `dados/preparar_dados.py`).
`dados/gerar_dados.py` transforma essa base em `js/dados.js`, que as telas leem:

```bash
python3 dados/gerar_dados.py
```

Regras do modelo (ficam no topo do script e podem ser ajustadas):

- **Mês de referência:** Set/2026. Out/2026 na base é mês parcial e não entra nos saldos.
- **Instituição:** a base não informa. Cada categoria é atribuída por mapeamento fixo: Investimentos e Poupança → Inter; Amazon, Restaurantes, Viagens, Outras compras, Lazer e Roupas → Itaú (cartão); o resto → Nubank (conta).
- **Inter (Investimentos):** tudo que foi enviado para Investimentos e Poupança até o mês de referência.
- **Itaú (Crédito):** fatura aberta = gastos no cartão no mês de referência.
- **Nubank (Contas):** saldo de abertura + entradas − saídas, somando de volta a fatura ainda não paga. O saldo de abertura (R$ 5.300) é o menor valor que impede a conta de ficar negativa em qualquer mês, já que a base não traz saldo inicial.
- **Recorrentes do Fluxo:** média mensal dos últimos 12 meses de Salário, Contas e Serviços. Saldo inicial da projeção = saldo do Nubank.
- **Extrato:** cada linha é um mês + categoria (a base é agregada, sem dia nem descrição). Data aparece como mês/ano.
- Instituição desconectada some do patrimônio, do Extrato e dos recorrentes do Fluxo.

## Funcionalidades

**Geral**
- Modo claro/escuro (botão no topo, salvo no navegador).
- Menu do perfil com "Meu cadastro" e "Sair" (com confirmação).

**Login**
- Checklist de requisitos da senha atualizado a cada tecla: mínimo de 8 caracteres, uma letra maiúscula, um número e um símbolo.
- O envio só segue para a tela Início quando todos os requisitos são atendidos. O usuário (CPF ou e-mail) não é validado.

**Início**
- Patrimônio e rosca recalculados conforme as instituições conectadas. Itaú começa desconectado, então o total vem com a nota "Sem a fatura do Itaú (desconectado)".
- Mercado hoje busca Selic (série 432) e dólar de venda (série 1) em `api.bcb.gov.br`; se a chamada falhar aparece uma mensagem simples.

**Instituições**
- Nubank e Inter começam conectados; Itaú começa desconectado. Revogar abre modal de alerta; conectar abre modal com os dados a confirmar.
- Cada card muda de estado e a mudança é anunciada por uma região `aria-live`.

**Extrato**
- Busca sem acento ("salario" encontra Salário), filtros por instituição, categoria e período, aviso de período inválido, estado vazio e total recalculado.
- O gráfico mostra as 5 maiores categorias de gasto mais "Demais"; investimentos e poupança não contam como gasto. No celular as barras ficam na horizontal.

**Fluxo de caixa**
- Botões 3/6/12 meses redesenham o gráfico e o saldo projetado (padrão: 12 meses, de Set/2026 a Ago/2027). Cada meta cadastrada vira uma linha tracejada no gráfico.
- **Metas (CRUD no Back4App):** criar (formulário com campo de mês em calendário), listar (carrega ao abrir a página), editar (modal) e excluir (modal de confirmação). O código está em `js/back4app.js` (chamadas REST) e `js/fluxo.js` (interface).

## Back4App (CRUD de Metas)

1. Crie um app novo no [Back4App](https://www.back4app.com) e uma classe **`Metas`** com os campos:

   | Campo | Tipo | Observação |
   | --- | --- | --- |
   | `nome` | String | nome da meta |
   | `valor` | Number | valor em R$ |
   | `mes` | String | formato `AAAA-MM`, **sem acento** (o Parse não aceita acento em nome de campo) |

2. Em **App Settings > Security & Keys**, copie o *Application ID* e a *REST API Key* para `js/config.js`.
3. Em **Database Browser > Metas > Security > Class Level Permissions**, permita *Get, Find, Create, Update e Delete* para acesso público (o site não tem login). Sem isso a API responde 403.
4. **Nunca** coloque a *Master Key* no repositório. O *App ID* e a *REST API Key* ficam visíveis no navegador (é inevitável em site estático), por isso a proteção real é a CLP acima.

Sem a configuração, o card de Metas avisa "Back4App não configurado" e o resto do site funciona normalmente.

## Acessibilidade

- HTML semântico (`main`, `nav`, `section`, `article`, `table` com `scope`) e `lang="pt-BR"`.
- Rótulos para todos os campos, `aria-current` no item ativo do menu, `aria-expanded` no botão do menu e `role="alert"` nos erros.
- Modais com `role="dialog"`, `aria-modal`, foco movido para dentro ao abrir, foco preso (Tab/Shift+Tab), fechamento com `Esc` e retorno do foco ao botão de origem.
- Estados indicados por texto além da cor (por exemplo "Conectado/Desconectado" e ✓/× nos requisitos da senha).
- Foco visível nos botões e links e respeito a `prefers-reduced-motion` na tela de login.

## Responsividade

Layout adaptado para telas menores (breakpoint em 900px nas telas internas e 800px no login):

- O menu lateral vira uma barra de abas fixa na parte de baixo (Início, Instituições, Extrato, Fluxo). Nesse modo o botão "Sair" não aparece.
- No Extrato, a tabela vira uma lista compacta (a coluna de categoria some) e o total fica fixo acima da barra de abas.
- No Fluxo, o gráfico é redesenhado de acordo com a largura real do card.
- Testado em 360, 390 e 400 px (Chromium headless): nenhuma tela gera rolagem horizontal, o formulário e a lista de Metas cabem na largura e os modais de editar e excluir ficam dentro da tela.
- Os cards têm uma animação leve ao passar o mouse (sobem alguns pixels e ganham sombra). Ela só vale em dispositivos com mouse e é desligada para quem pede menos movimento (`prefers-reduced-motion`).

## Tecnologias

- HTML5
- CSS3 (variáveis CSS para cores, tipografia, espaçamentos e raios; tema escuro por `data-tema`)
- JavaScript (ES6+), sem frameworks
- [Chart.js](https://www.chartjs.org/) 4.4.7 (arquivo local em `js/vendor/`)
- [Back4App](https://www.back4app.com) (API REST do Parse) para o CRUD de Metas
- Python 3 só para preparar os dados (`dados/`)
- Fonte [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Estrutura do projeto

```
.
├── index.html, inicio.html, instituicoes.html, extrato.html, fluxo.html
├── css/        base (tokens e tema escuro), layout, componentes, modal e um arquivo por tela
├── js/
│   ├── tema.js         # modo claro/escuro
│   ├── estado.js       # formatação, conexões salvas, cores dos gráficos
│   ├── dados.js        # GERADO por dados/gerar_dados.py
│   ├── config.js       # App ID e REST API Key do Back4App
│   ├── back4app.js     # CRUD de Metas (API REST)
│   ├── layout.js       # menu do perfil, Meu cadastro, Sair
│   ├── inicio.js, extrato.js, fluxo.js, instituicoes.js, login.js
│   └── vendor/chart.umd.js
└── dados/
    ├── transacoes.json     # base real agregada
    ├── preparar_dados.py   # xlsx/Pix -> transacoes.json
    └── gerar_dados.py      # transacoes.json -> js/dados.js
```

## Como rodar

Não precisa instalar nada. Basta clonar e abrir no navegador:

```bash
git clone https://github.com/hlsshugoleonardo-byte/open-finance-hub-unicap.git
cd open-finance-hub-unicap
```

Abra o `index.html` no navegador (duplo clique) ou sirva a pasta com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

Para entrar no protótipo, use qualquer usuário e uma senha que cumpra os quatro requisitos (exemplo: `Senha@123`).

## Limitações

- Não há integração real com Open Finance. Os valores vêm de uma base real anonimizada, mas a atribuição a instituições é um modelo (veja Dados).
- O CRUD de Metas depende de `js/config.js` preenchido e da classe `Metas` criada no Back4App. As metas não são por usuário (o site não tem login): quem abrir o site vê as mesmas metas.
- O mês da meta é só informativo: a linha tracejada atravessa todo o gráfico, independentemente do mês.
- O login não autentica: as telas internas podem ser abertas diretamente, sem sessão.
- Os links "Esqueci a senha" e "Criar conta" ainda não levam a lugar nenhum.
- As conexões e o tema ficam salvos no navegador; os filtros do Extrato voltam ao padrão ao recarregar.
