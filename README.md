# Open Finance Hub

Protótipo front-end de um hub financeiro baseado em Open Finance: reúne contas, cartões e investimentos de várias instituições em um só lugar, com filtros, contexto e confirmações claras a cada ação.

**Demo:** https://tainagrunberg.github.io/open-finance-hub-project/

> Projeto estático feito só com HTML, CSS e JavaScript puro. Todos os dados exibidos são fictícios e não há back-end nem autenticação real.

## Telas

| Tela | Arquivo | O que faz |
| --- | --- | --- |
| Login | `index.html` | Formulário de acesso com validação da senha em tempo real e botão para mostrar/ocultar a senha. |
| Início | `inicio.html` | Resumo do patrimônio total, gráfico de rosca com a composição (investimentos, contas e crédito) e saldo por instituição. |
| Instituições | `instituicoes.html` | Lista de instituições com status de conexão. Permite conectar e revogar o compartilhamento de dados, sempre com um modal de confirmação. |
| Extrato | `extrato.html` | Tabela de transações com busca por texto e filtros de instituição, categoria e período. Mostra os filtros aplicados como chips e o total do resultado. |
| Fluxo de caixa | `fluxo.html` | Projeção do saldo para os próximos meses em gráfico de linha, calculada a partir de receitas e despesas recorrentes. |

## Funcionalidades

**Login**
- Checklist de requisitos da senha atualizado a cada tecla: mínimo de 8 caracteres, uma letra maiúscula, um número e um símbolo.
- O envio só segue para a tela Início quando todos os requisitos são atendidos. O usuário (CPF ou e-mail) não é validado.

**Início**
- Valores do patrimônio, da legenda e das instituições escritos direto no HTML.
- Gráfico de rosca feito com `conic-gradient` no CSS, com `aria-label` descrevendo os percentuais.

**Instituições**
- Nubank e Inter começam conectados; Itaú começa desconectado.
- Revogar acesso abre um modal explicando o efeito. Conectar abre um modal com os dados a confirmar (instituição, titular, tipo de conta e agência).
- Cada card muda de estado (selo, descrição e botão) e a mudança é anunciada para leitores de tela por uma região `aria-live`.

**Extrato**
- Busca por descrição e filtros por instituição, categoria e período (mês/ano inicial e final).
- Período inválido (data inicial depois da final) mostra um aviso de erro e esvazia a lista.
- Estado vazio com mensagem própria, botão "Limpar filtros" e total recalculado a cada filtro.
- As transações ficam em um array no início de `js/extrato.js`.

**Fluxo de caixa**
- Saldo inicial, mês de início, quantidade de meses e lista de recorrentes (salário, aluguel e assinaturas) definidos no topo de `js/fluxo.js`.
- O saldo de cada mês é o saldo inicial somado ao líquido mensal dos recorrentes. O gráfico em SVG é desenhado por JavaScript e redesenhado ao redimensionar a janela.
- Uma tabela oculta visualmente (`sr-only`) traz os mesmos dados do gráfico para leitores de tela.

**Layout compartilhado** (`js/layout.js`)
- Menu lateral de navegação nas telas internas, com botão "Sair" que pede confirmação antes de voltar ao login.
- O script também traz a lógica de um menu hambúrguer com overlay (fecha por clique fora e pela tecla `Esc`), mas o botão está oculto no CSS atual; no celular a navegação é feita pela barra de abas (veja Responsividade).

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

## Tecnologias

- HTML5
- CSS3 (variáveis CSS para cores, tipografia, espaçamentos e raios; um arquivo por tela)
- JavaScript (ES6+), sem frameworks nem dependências
- Fonte [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Estrutura do projeto

```
.
├── index.html           # Login
├── inicio.html          # Resumo do patrimônio
├── instituicoes.html    # Conexão com instituições
├── extrato.html         # Transações e filtros
├── fluxo.html           # Projeção de fluxo de caixa
├── css/
│   ├── base.css         # Variáveis (design tokens), reset e utilitários
│   ├── layout.css       # Menu lateral/barra de abas, topo e estrutura das telas internas
│   ├── componentes.css  # Logos das instituições (usados em Início e Instituições)
│   ├── login.css
│   ├── inicio.css
│   ├── instituicoes.css
│   ├── extrato.css
│   └── fluxo.css
└── js/
    ├── layout.js        # Botão sair e lógica do menu hambúrguer
    ├── login.js         # Validação da senha e redirecionamento
    ├── instituicoes.js  # Estados dos cards e modais
    ├── extrato.js       # Dados, filtros e renderização da tabela
    └── fluxo.js         # Cálculo da projeção e gráfico SVG
```

## Como rodar

Não precisa instalar nada. Basta clonar e abrir no navegador:

```bash
git clone https://github.com/tainagrunberg/open-finance-hub-project.git
cd open-finance-hub-project
```

Abra o `index.html` no navegador (duplo clique) ou sirva a pasta com qualquer servidor estático, por exemplo:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

Para entrar no protótipo, use qualquer usuário e uma senha que cumpra os quatro requisitos (exemplo: `Senha@123`).

## Limitações

- Não há back-end, banco de dados nem integração real com Open Finance; todos os dados são fictícios.
- O login não autentica: as telas internas podem ser abertas diretamente, sem sessão.
- Os links "Esqueci a senha" e "Criar conta" ainda não levam a lugar nenhum.
- O estado das conexões e dos filtros não é salvo; ao recarregar a página tudo volta ao padrão.
