const API_JOGOS = 'https://www.cheapshark.com/api/1.0';
const API_COTACAO = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';
const API_PEDIDO = 'https://jsonplaceholder.typicode.com/posts';

const DESCONTO_DA_LOJA = 0.10;

const JOGOS_FAMOSOS = [
  '298615',
  '327581',
  '307273',
  '206516',
  '236717',
  '202350',
  '249998',
  '233750',
  '236053',
  '248711',
  '260921',
  '272353'
];

let cotacaoDolar = null;
let nomesDasLojas = {};
let jogosNaTela = {};
let carrinho = [];
let promocoesCarregadas = false;
let jogosFamosos = [];
let catalogoPromocoes = [];

function mostrarAba(evento) {
  const endereco = location.hash || '#inicio';

  document.querySelectorAll('.tela').forEach(tela => tela.classList.add('d-none'));
  if (evento) {
    limparMensagem();
  }
  window.scrollTo(0, 0);

  if (endereco.startsWith('#jogo/')) {
    document.getElementById('tela-jogo').classList.remove('d-none');
    carregarDetalhes(endereco.replace('#jogo/', ''));
  } else if (endereco === '#promocoes') {
    document.getElementById('tela-promocoes').classList.remove('d-none');
    if (!promocoesCarregadas) {
      carregarPromocoes();
    }
  } else if (endereco === '#carrinho') {
    document.getElementById('tela-carrinho').classList.remove('d-none');
    mostrarCarrinho();
  } else {
    document.getElementById('tela-inicio').classList.remove('d-none');
  }
}

window.addEventListener('hashchange', mostrarAba);

document.querySelectorAll('#menu .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    bootstrap.Collapse.getOrCreateInstance('#menu', { toggle: false }).hide();
  });
});

function mostrarMensagem(texto, tipo, tentarNovamente) {
  const area = document.getElementById('mensagem');
  area.innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;

  if (tentarNovamente) {
    const botao = document.createElement('button');
    botao.className = 'btn btn-sm btn-dark ms-2';
    botao.textContent = 'Tentar de novo';
    botao.addEventListener('click', tentarNovamente);
    area.querySelector('.alert').appendChild(botao);
  }
}

function limparMensagem() {
  document.getElementById('mensagem').innerHTML = '';
}

function mostrarCarregando(ligado, botao) {
  document.getElementById('carregando').classList.toggle('d-none', !ligado);
  if (botao) {
    botao.disabled = ligado;
  }
}

async function buscarJSON(url, opcoes) {
  const resposta = await fetch(url, opcoes);
  if (!resposta.ok) {
    const erro = new Error('Erro HTTP ' + resposta.status);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}

function tratarErro(erro, tentarNovamente) {
  if (erro.status === 404) {
    mostrarMensagem('Não encontramos o que você procurou (erro 404).', 'warning', tentarNovamente);
  } else if (erro.status) {
    mostrarMensagem('O servidor deu erro ' + erro.status + '. Tente de novo mais tarde.', 'warning', tentarNovamente);
  } else {
    mostrarMensagem('Não foi possível conectar. Verifique sua internet.', 'danger', tentarNovamente);
  }
}

function formatarPreco(precoEmDolar) {
  if (precoEmDolar === 0) {
    return 'GRÁTIS';
  }
  if (cotacaoDolar) {
    return (precoEmDolar * cotacaoDolar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return 'US$ ' + precoEmDolar.toFixed(2);
}

function nossoPreco(precoMercado) {
  return precoMercado * (1 - DESCONTO_DA_LOJA);
}

function calcularDesconto(nosso, precoCheio) {
  if (precoCheio <= 0) {
    return 0;
  }
  return Math.round((1 - nosso / precoCheio) * 100);
}

function capaGrande(steamAppID, imagemPequena) {
  if (steamAppID) {
    return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/' + steamAppID + '/header.jpg';
  }
  return imagemPequena;
}

const APELIDOS = {
  'gta': 'grand theft auto',
  'fifa': 'ea sports fc',
  'cod': 'call of duty',
  'rdr': 'red dead redemption',
  'mk': 'mortal kombat',
  're': 'resident evil',
  'spiderman': 'spider-man',
  'homem aranha': 'spider-man'
};

function trocarApelido(termo) {
  return APELIDOS[termo.toLowerCase()] || termo;
}

function nomeCombina(titulo, termo) {
  return (' ' + titulo.toLowerCase()).includes(' ' + termo.toLowerCase());
}

const PALAVRAS_CONHECIDAS = ('grand theft auto red dead redemption elden ring cyberpunk hogwarts legacy ' +
  'forza horizon god war spider mortal kombat resident evil call duty battlefield witcher skyrim ' +
  'fallout batman far cry assassins creed need speed tomb raider dark souls sekiro baldurs gate doom ' +
  'portal half life hollow knight stardew valley terraria counter strike rocket league sports street ' +
  'fighter tekken persona metal gear solid sonic minecraft hades stray cuphead').split(' ');

function distancia(a, b) {
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const troca = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + troca);
    }
    anterior = atual;
  }
  return anterior[b.length];
}

function corrigirPalavra(palavra) {
  if (palavra.length < 3 || PALAVRAS_CONHECIDAS.includes(palavra)) {
    return palavra;
  }
  const limite = palavra.length >= 7 ? 2 : 1;
  let melhor = palavra;
  let menor = limite + 1;
  PALAVRAS_CONHECIDAS.forEach(conhecida => {
    const d = distancia(palavra, conhecida);
    const mesmaLetra = conhecida[0] === palavra[0];
    if (d < menor || (d === menor && mesmaLetra)) {
      menor = d;
      melhor = conhecida;
    }
  });
  return melhor;
}

function corrigirBusca(termo) {
  return termo.toLowerCase().split(' ').map(corrigirPalavra).join(' ');
}

async function carregarCotacao() {
  try {
    const dados = await buscarJSON(API_COTACAO);
    cotacaoDolar = Number(dados.USDBRL.bid);
  } catch (erro) {
    document.getElementById('texto-cotacao').textContent =
      'Não foi possível pegar a cotação do dólar. Preços em US$.';
  }
}

async function carregarLojas() {
  try {
    const lojas = await buscarJSON(API_JOGOS + '/stores');

    lojas.forEach(loja => {
      if (loja.isActive === 1) {
        nomesDasLojas[loja.storeID] = loja.storeName;
      }
    });
  } catch (erro) {
    tratarErro(erro, () => location.reload());
  }
}

function mostrarJogos(jogos, idDaLista, emPromocao) {
  const lista = document.getElementById(idDaLista);

  if (jogos.length === 0) {
    lista.innerHTML = '<div class="col-12"><div class="alert alert-info">Nenhum jogo encontrado.</div></div>';
    return;
  }

  let html = '';
  jogos.forEach(jogo => {
    jogosNaTela[jogo.id] = jogo;
    html += criarCard(jogo, emPromocao);
  });
  lista.innerHTML = html;
}

function criarCard(jogo, emPromocao) {
  let desconto = '';
  let precoAntigo = '';
  if (emPromocao) {
    desconto = `<span class="selo-desconto">-${jogo.desconto}%</span>`;
    precoAntigo = `De <s>${formatarPreco(jogo.precoCheio)}</s> por`;
  }

  return `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <div class="card cartucho h-100">
        <img src="${jogo.imagem}" class="capa" alt="${jogo.titulo}"
             onerror="this.onerror=null; this.src='${jogo.imagemReserva}'">
        ${desconto}
        <div class="card-body d-flex flex-column">
          <h3 class="card-title">
            <a href="#jogo/${jogo.id}" class="stretched-link">${jogo.titulo}</a>
          </h3>
          <p class="preco-antigo">${precoAntigo}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="etiqueta">${formatarPreco(jogo.preco)}</span>
            <button class="btn btn-principal btn-sm por-cima" onclick="adicionarAoCarrinho('${jogo.id}')">+ Carrinho</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function carregarFamosos() {
  const botao = document.getElementById('botao-famosos');
  document.getElementById('titulo-lista').textContent = 'Os mais pedidos';
  limparMensagem();
  document.getElementById('lista-inicio').innerHTML = '';
  mostrarCarregando(true, botao);

  try {
    const dados = await buscarJSON(API_JOGOS + '/games?ids=' + JOGOS_FAMOSOS.join(','));

    const jogos = [];
    JOGOS_FAMOSOS.forEach(id => {
      const jogo = dados[id];
      if (jogo && jogo.deals.length > 0) {
        const oferta = jogo.deals[0];
        const preco = nossoPreco(Number(oferta.price));
        jogos.push({
          id: id,
          titulo: jogo.info.title,
          imagem: capaGrande(jogo.info.steamAppID, jogo.info.thumb),
          imagemReserva: jogo.info.thumb,
          preco: preco,
          precoCheio: Number(oferta.retailPrice),
          desconto: calcularDesconto(preco, Number(oferta.retailPrice)),
          emPromocao: Number(oferta.price) < Number(oferta.retailPrice)
        });
      }
    });
    jogosFamosos = jogos;
    mostrarJogos(jogos, 'lista-inicio');
  } catch (erro) {
    tratarErro(erro, carregarFamosos);
  } finally {
    mostrarCarregando(false, botao);
  }
}

async function buscarPorNome(busca) {
  const dados = await buscarJSON(API_JOGOS + '/games?title=' + encodeURIComponent(busca));
  const jogos = dados.map(jogo => ({
    id: jogo.gameID,
    titulo: jogo.external,
    imagem: capaGrande(jogo.steamAppID, jogo.thumb),
    imagemReserva: jogo.thumb,
    preco: nossoPreco(Number(jogo.cheapest))
  }));
  return jogos.filter(jogo => nomeCombina(jogo.titulo, busca));
}

document.getElementById('form-busca').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const termo = document.getElementById('campo-busca').value.trim();
  const botao = document.getElementById('botao-busca');

  if (termo.length < 2) {
    mostrarMensagem('Digite pelo menos 2 letras para buscar.', 'warning');
    return;
  }

  limparMensagem();
  document.getElementById('titulo-lista').textContent = 'Resultado para "' + termo + '"';
  document.getElementById('lista-inicio').innerHTML = '';
  mostrarCarregando(true, botao);

  try {
    const semApelido = trocarApelido(termo).toLowerCase();
    let busca = semApelido;
    let aproximado = false;
    let encontrados = await buscarPorNome(busca);

    if (encontrados.length === 0 && corrigirBusca(semApelido) !== semApelido) {
      busca = corrigirBusca(semApelido);
      encontrados = await buscarPorNome(busca);
      aproximado = true;
    }

    if (encontrados.length === 0 && busca.length > 4) {
      encontrados = await buscarPorNome(busca.slice(0, 4));
      aproximado = true;
    }

    if (encontrados.length === 0) {
      mostrarMensagem('Não achamos nenhum jogo com esse nome. Confira se está escrito certo e tente de novo.', 'info');
    } else {
      if (aproximado) {
        mostrarMensagem('Você digitou "' + termo.replace(/[<>]/g, '') + '". Mostrando os jogos mais parecidos.', 'info');
      }
      mostrarJogos(encontrados, 'lista-inicio');
    }
  } catch (erro) {
    tratarErro(erro, () => evento.target.requestSubmit());
  } finally {
    mostrarCarregando(false, botao);
  }
});

async function carregarDetalhes(id) {
  const area = document.getElementById('detalhe-jogo');
  area.innerHTML = '';
  mostrarCarregando(true);

  try {
    const dados = await buscarJSON(API_JOGOS + '/games?id=' + id);
    if (!dados.deals || dados.deals.length === 0) {
      mostrarMensagem('Esse jogo não está à venda em nenhuma loja agora. <a href="#inicio" class="alert-link">Voltar para o início</a>', 'info');
      return;
    }
    const melhor = dados.deals[0];
    const precoMercado = Number(melhor.price);

    jogosNaTela[id] = {
      id: id,
      titulo: dados.info.title,
      imagem: capaGrande(dados.info.steamAppID, dados.info.thumb),
      imagemReserva: dados.info.thumb,
      preco: nossoPreco(precoMercado)
    };
    const jogo = jogosNaTela[id];

    let linhas = '';
    dados.deals.forEach(oferta => {
      linhas += `
        <tr>
          <td>${nomesDasLojas[oferta.storeID] || 'Outra loja'}</td>
          <td>${formatarPreco(Number(oferta.price))}</td>
        </tr>`;
    });

    area.innerHTML = `
      <div class="row g-4">
        <div class="col-12 col-md-6">
          <img src="${jogo.imagem}" class="capa-detalhe" alt="${jogo.titulo}"
               onerror="this.onerror=null; this.src='${jogo.imagemReserva}'">
        </div>
        <div class="col-12 col-md-6">
          <h1 class="h2">${jogo.titulo}</h1>
          <p class="mb-1">Nas outras lojas, a partir de ${formatarPreco(precoMercado)}. Aqui:</p>
          <span class="etiqueta grande">${formatarPreco(jogo.preco)}</span>
          <p class="mt-3">Aqui ele sai mais barato que em qualquer outra loja. Pode conferir abaixo!</p>
          <button class="btn btn-principal btn-lg" onclick="adicionarAoCarrinho('${id}')">Colocar no carrinho</button>
        </div>
      </div>

      <div class="caixa mt-5">
        <h2 class="h4">Compare com outras lojas</h2>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr><th>Loja</th><th>Preço lá</th></tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>`;
  } catch (erro) {
    if (erro.status === 404) {
      mostrarMensagem('Esse jogo não foi encontrado. <a href="#inicio" class="alert-link">Voltar para o início</a>', 'warning');
    } else {
      tratarErro(erro, () => carregarDetalhes(id));
    }
  } finally {
    mostrarCarregando(false);
  }
}

async function carregarPromocoes() {
  const select = document.getElementById('select-preco');
  limparMensagem();
  document.getElementById('lista-promocoes').innerHTML = '';
  mostrarCarregando(true, select);

  try {
    const dados = await buscarJSON(API_JOGOS + '/deals?AAA=1&onSale=1&sortBy=Metacritic&pageSize=60');

    const jogos = ofertasParaJogos(dados);

    const famososEmPromocao = jogosFamosos.filter(jogo => jogo.emPromocao);
    const outros = jogos.filter(jogo => !jogosFamosos.some(famoso => famoso.id === jogo.id));
    catalogoPromocoes = famososEmPromocao.concat(outros);
    promocoesCarregadas = true;
    filtrarPorPreco();
  } catch (erro) {
    tratarErro(erro, carregarPromocoes);
  } finally {
    mostrarCarregando(false, select);
  }
}

function ofertasParaJogos(dados) {
  const maisBaratas = {};
  dados.forEach(oferta => {
    const guardada = maisBaratas[oferta.gameID];
    if (!guardada || Number(oferta.salePrice) < Number(guardada.salePrice)) {
      maisBaratas[oferta.gameID] = oferta;
    }
  });

  return Object.values(maisBaratas).map(oferta => {
    const preco = nossoPreco(Number(oferta.salePrice));
    return {
      id: oferta.gameID,
      titulo: oferta.title,
      imagem: capaGrande(oferta.steamAppID, oferta.thumb),
      imagemReserva: oferta.thumb,
      preco: preco,
      precoCheio: Number(oferta.normalPrice),
      desconto: calcularDesconto(preco, Number(oferta.normalPrice))
    };
  });
}

async function carregarGratis() {
  const select = document.getElementById('select-preco');
  limparMensagem();
  document.getElementById('lista-promocoes').innerHTML = '';
  mostrarCarregando(true, select);

  try {
    const dados = await buscarJSON(API_JOGOS + '/deals?upperPrice=0');
    mostrarJogos(ofertasParaJogos(dados), 'lista-promocoes', true);
  } catch (erro) {
    tratarErro(erro, carregarGratis);
  } finally {
    mostrarCarregando(false, select);
  }
}

function filtrarPorPreco() {
  const faixa = document.getElementById('select-preco').value;

  if (faixa === 'gratis') {
    carregarGratis();
    return;
  }
  let jogos = catalogoPromocoes.slice();

  if (faixa !== 'todos') {
    const minimo = Number(faixa.split('-')[0]);
    const maximo = Number(faixa.split('-')[1]);
    jogos = jogos.filter(jogo => {
      const precoEmReais = jogo.preco * (cotacaoDolar || 1);
      return precoEmReais >= minimo && precoEmReais <= maximo;
    });
  }

  jogos.sort((a, b) => a.preco - b.preco);
  mostrarJogos(jogos, 'lista-promocoes', true);
}

document.getElementById('select-preco').addEventListener('change', filtrarPorPreco);

function adicionarAoCarrinho(id) {
  const jogo = jogosNaTela[id];

  const jaTem = carrinho.some(item => item.id === id);
  if (jaTem) {
    mostrarMensagem(jogo.titulo + ' já está no carrinho.', 'info');
  } else {
    carrinho.push(jogo);
    mostrarMensagem(jogo.titulo + ' foi para o carrinho!', 'success');
  }
  atualizarContador();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(item => item.id !== id);
  atualizarContador();
  mostrarCarrinho();
}

function atualizarContador() {
  document.getElementById('contador-carrinho').textContent = carrinho.length;
}

function totalDoCarrinho() {
  return carrinho.reduce((soma, item) => soma + item.preco, 0);
}

function formaDePagamento() {
  const marcada = document.querySelector('input[name="pagamento"]:checked');
  return marcada ? marcada.value : '';
}

function atualizarParcelas() {
  const total = totalDoCarrinho();
  const cartao = formaDePagamento() === 'Cartão de crédito';
  document.getElementById('area-parcelas').classList.toggle('d-none', !cartao);

  let opcoes = '';
  if (total === 0) {
    opcoes = '<option value="1">Coloque um jogo pago no carrinho para ver as parcelas</option>';
  } else {
    for (let vezes = 1; vezes <= 6; vezes++) {
      opcoes += `<option value="${vezes}">${vezes}x de ${formatarPreco(total / vezes)} sem juros</option>`;
    }
  }
  document.getElementById('select-parcelas').innerHTML = opcoes;
  mostrarValorDaParcela();
}

function mostrarValorDaParcela() {
  const total = totalDoCarrinho();
  const vezes = Number(document.getElementById('select-parcelas').value);
  let texto = '';
  if (total > 0) {
    texto = `Você vai pagar <strong>${vezes}x de ${formatarPreco(total / vezes)}</strong>, total de ${formatarPreco(total)}, sem juros.`;
  }
  document.getElementById('valor-parcela').innerHTML = texto;
}

document.getElementById('select-parcelas').addEventListener('change', mostrarValorDaParcela);

document.querySelectorAll('input[name="pagamento"]').forEach(opcao => {
  opcao.addEventListener('change', atualizarParcelas);
});

function mostrarCarrinho() {
  const lista = document.getElementById('lista-carrinho');
  const total = totalDoCarrinho();

  if (carrinho.length === 0) {
    lista.innerHTML = '<li class="list-group-item">Seu carrinho está vazio. <a href="#inicio">Ver jogos</a></li>';
  } else {
    lista.innerHTML = '';
    carrinho.forEach(item => {
      lista.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${item.titulo}<br><strong>${formatarPreco(item.preco)}</strong></span>
          <button class="btn btn-sm btn-principal" onclick="removerDoCarrinho('${item.id}')">Remover</button>
        </li>`;
    });
  }

  if (total === 0) {
    document.getElementById('total-carrinho').textContent = 'R$ 0,00';
  } else {
    document.getElementById('total-carrinho').textContent = formatarPreco(total);
  }
  atualizarParcelas();
}

function mostrarPix(numeroPedido, total) {
  const valorEmReais = (total * (cotacaoDolar || 1)).toFixed(2);
  const codigo = 'PIXBARATO-PEDIDO' + numeroPedido + '-VALOR' + valorEmReais;
  document.getElementById('mensagem').innerHTML += `
    <div class="caixa mt-3">
      <h2 class="h5">Pague com Pix</h2>
      <p>Valor: <strong>${formatarPreco(total)}</strong>. Copie o código e cole no app do seu banco, em Pix Copia e Cola.</p>
      <div class="input-group">
        <input id="codigo-pix" class="form-control" value="${codigo}" readonly>
        <button id="botao-pix" class="btn btn-principal" type="button" onclick="copiarCodigo('codigo-pix', 'botao-pix')">Copiar código</button>
      </div>
      <p class="small mt-2 mb-0">Pagamento simulado: a Pixel Barato é uma loja fictícia e nada é cobrado.</p>
    </div>`;
}

function mostrarBoleto(numeroPedido, total) {
  const vencimento = new Date();
  vencimento.setDate(vencimento.getDate() + 3);

  const centavos = String(Math.round(total * (cotacaoDolar || 1) * 100)).padStart(10, '0');
  const pedido = String(numeroPedido).padStart(5, '0');
  const linha = '00000.' + pedido + ' 00000.000000 00000.000000 0 0000' + centavos;

  document.getElementById('mensagem').innerHTML += `
    <div class="caixa mt-3">
      <h2 class="h5">Boleto gerado</h2>
      <p class="mb-1">Pedido nº <strong>${numeroPedido}</strong> · Valor: <strong>${formatarPreco(total)}</strong></p>
      <p>Vencimento: <strong>${vencimento.toLocaleDateString('pt-BR')}</strong>. Pague no app do banco ou numa lotérica usando a linha abaixo.</p>
      <div class="input-group">
        <input id="codigo-boleto" class="form-control" value="${linha}" readonly>
        <button id="botao-boleto" class="btn btn-principal" type="button" onclick="copiarCodigo('codigo-boleto', 'botao-boleto')">Copiar linha</button>
      </div>
      <p class="small mt-2 mb-0">Boleto simulado: a Pixel Barato é uma loja fictícia e nada é cobrado. As chaves chegam depois que o pagamento é confirmado.</p>
    </div>`;
}

function copiarCodigo(idCampo, idBotao) {
  const campo = document.getElementById(idCampo);
  campo.select();
  navigator.clipboard.writeText(campo.value)
    .then(() => { document.getElementById(idBotao).textContent = 'Copiado!'; })
    .catch(() => { document.getElementById(idBotao).textContent = 'Selecione e copie'; });
}

document.getElementById('form-pedido').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome = document.getElementById('campo-nome').value.trim().replace(/[<>]/g, '');
  const email = document.getElementById('campo-email').value.trim();
  const pagamento = formaDePagamento();
  const parcelas = Number(document.getElementById('select-parcelas').value);
  const botao = document.getElementById('botao-finalizar');
  const total = totalDoCarrinho();

  if (carrinho.length === 0) {
    mostrarMensagem('Seu carrinho está vazio.', 'warning');
    return;
  }
  if (nome.length < 3) {
    mostrarMensagem('Digite seu nome.', 'warning');
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    mostrarMensagem('Digite um e-mail válido. Exemplo: voce@email.com', 'warning');
    return;
  }
  if (!pagamento && total > 0) {
    mostrarMensagem('Escolha a forma de pagamento.', 'warning');
    return;
  }

  let textoPagamento = total > 0 ? pagamento : 'jogo grátis, sem pagamento';
  if (pagamento === 'Cartão de crédito' && total > 0) {
    textoPagamento += ' em ' + parcelas + 'x de ' + formatarPreco(total / parcelas);
  }

  limparMensagem();
  botao.disabled = true;
  botao.textContent = 'Enviando...';

  try {
    const resposta = await buscarJSON(API_PEDIDO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: nome,
        email: email,
        jogos: carrinho.map(item => item.titulo),
        pagamento: textoPagamento
      })
    });

    mostrarMensagem('Pedido nº ' + resposta.id + ' confirmado, ' + resposta.cliente +
      '! Pagamento: ' + resposta.pagamento + '. As chaves vão para ' + resposta.email + '.', 'success');

    if (pagamento === 'Pix' && total > 0) {
      mostrarPix(resposta.id, total);
    }
    if (pagamento === 'Boleto' && total > 0) {
      mostrarBoleto(resposta.id, total);
    }

    carrinho = [];
    atualizarContador();
    evento.target.reset();
    mostrarCarrinho();
  } catch (erro) {
    tratarErro(erro, () => evento.target.requestSubmit());
  } finally {
    botao.disabled = false;
    botao.textContent = 'Finalizar pedido';
  }
});

async function iniciar() {
  await carregarCotacao();
  await carregarLojas();
  await carregarFamosos();
  mostrarAba();
}

iniciar();
