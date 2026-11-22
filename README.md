# Pixel Barato

Loja de jogos para PC (fictícia) que vende cada jogo **10% mais barato** que o menor preço do mercado.
O site busca, em tempo real, quanto o jogo custa em lojas como Steam, Epic e GOG, converte para reais
e calcula o preço da Pixel Barato. Ao clicar num jogo, aparece quanto ele custa em cada loja concorrente,
para o cliente comparar. O usuário monta um carrinho e finaliza o pedido (a compra é simulada).

Feito só com HTML, CSS e JavaScript (fetch), sem back-end e sem bibliotecas JavaScript.

## Integrantes

| Nome completo | Matrícula |
|---|---|
| Caio Carvalho | 202520420 |
| João Antonio | 202520153 |
| Pedro Artur | 202611119 |

## Links

- **GitHub Pages:** https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
- **Repositório:** https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO

## Framework CSS

**Bootstrap 5.3**: grid (`row`/`col`), navbar com menu "hambúrguer" no celular, cards, `stretched-link`,
tabela responsiva, list-group, alerts, spinner, formulários (`form-control`, `form-select`, `form-check`) e `input-group`.
O arquivo `css/estilo.css` personaliza as cores, as fontes e o formato dos cards.

## APIs e endpoints usados

| # | API | Método | URL | Para que serve no sistema |
|---|---|---|---|---|
| 1 | AwesomeAPI | GET | `https://economia.awesomeapi.com.br/json/last/USD-BRL` | Cotação do dólar, para mostrar todos os preços em reais |
| 2 | CheapShark | GET | `https://www.cheapshark.com/api/1.0/stores` | Nomes das lojas concorrentes na tabela "Compare com outras lojas" da página do jogo |
| 3 | CheapShark | GET | `https://www.cheapshark.com/api/1.0/games` (`?ids=`, `?title=`, `?id=`) | Jogos famosos do Início, busca pelo nome e página do jogo com o preço nas lojas concorrentes |
| 4 | CheapShark | GET | `https://www.cheapshark.com/api/1.0/deals?AAA=1&onSale=1&sortBy=Metacritic` | Aba Promoções: grandes jogos (AAA) em promoção de verdade (abaixo do preço cheio), filtrados por faixa de preço; com `?upperPrice=0`, os jogos grátis por tempo limitado |
| 5 | JSONPlaceholder | POST | `https://jsonplaceholder.typicode.com/posts` | Envia o pedido; o número do pedido devolvido aparece na tela |

A JSONPlaceholder simula o pedido (não grava de verdade), mas responde como uma API real.
A CheapShark não precisa de chave.

## Estrutura

```
projeto/
├── index.html      -> todas as abas (Início, Promoções, Jogo, Carrinho)
├── css/
│   └── estilo.css  -> visual próprio por cima do Bootstrap
├── js/
│   └── app.js      -> navegação entre abas, chamadas às APIs, carrinho e tratamento de erros
├── img/
│   ├── logo.png    -> logo do site (cabeçalho)
│   └── icone.png   -> ícone da aba do navegador
└── README.md
```

## Como usar

1. Abra o link do GitHub Pages.
2. **Início:** veja os jogos famosos ou procure um jogo pelo nome (ex.: `batman`). A busca entende apelidos (`gta`, `fifa`) e erros de digitação (`cyberpunck`).
3. Clique num jogo para abrir a página dele: aparece o nosso preço e quanto ele custa nas outras lojas. O botão **Voltar** (ou o voltar do navegador) retorna.
4. **Promoções:** aqui ficam só os jogos em promoção de verdade, com o selo de desconto e o "De R$ X por R$ Y". Escolha quanto quer gastar (grátis, até R$ 50, R$ 50 a 100, R$ 100 a 200 ou mais de R$ 200) e veja os jogos dessa faixa, do mais barato para o mais caro.
5. Clique em **+ Carrinho** nos jogos que quiser.
6. **Carrinho:** preencha nome e e-mail, escolha a forma de pagamento (Pix, cartão de débito, cartão de crédito em até 6x ou boleto; no Pix aparece um código "copia e cola" e no boleto a linha digitável com vencimento, ambos simulados) e clique em **Finalizar pedido**.

## Tratamento de falhas

| Situação | O que aparece |
|---|---|
| Sem internet / API fora do ar | Alerta vermelho "Não foi possível conectar" com botão **Tentar de novo** |
| Erro HTTP 404 | Ex.: abrir um jogo que não existe mostra "Esse jogo não foi encontrado" |
| Outros erros HTTP (500...) | Alerta com o código do erro e botão **Tentar de novo** |
| Cotação indisponível | A loja continua funcionando, com os preços em US$ |
| Busca sem resultado | Aviso "Não achamos nenhum jogo com esse nome" (antes disso, a busca tenta corrigir erros de digitação) |
| Entrada inválida | Busca com menos de 2 letras, carrinho vazio, nome curto, e-mail inválido, pagamento não escolhido |
| Carregamento | Spinner na tela e botão desativado enquanto espera |
