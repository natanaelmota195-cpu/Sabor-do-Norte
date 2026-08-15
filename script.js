/* ==========================================================================
   SABOR DO NORTE — script.js
   JavaScript puro (ES6+), sem frameworks e sem dependências externas.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     0. HELPERS DE IMAGEM (placeholders)
     Gera uma imagem SVG em memória (data URI) para servir de placeholder
     visual até que as fotos reais dos pratos sejam adicionadas.
     SUBSTITUA: quando tiver as fotos reais, troque o "src" dos elementos
     <img> por um caminho como "assets/images/pratos/tacaca.jpg".
  ------------------------------------------------------------------------ */
  function criarPlaceholder(emoji, corA, corB) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${corA}"/>
            <stop offset="100%" stop-color="${corB}"/>
          </linearGradient>
        </defs>
        <rect width="600" height="450" fill="url(#g)"/>
        <text x="50%" y="54%" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  const CORES = {
    verde: ['#7ED957', '#5CB93A'],
    azul: ['#0A3A2B', '#06331F'], // tons adaptados para o tema escuro (verdes profundos)
    verdeClaro: ['#B7EE97', '#7ED957'],
  };

  /* ------------------------------------------------------------------------
     1. HEADER — efeito ao rolar a página
  ------------------------------------------------------------------------ */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ------------------------------------------------------------------------
     2. MENU MOBILE (hamburguer)
  ------------------------------------------------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const navOverlay = document.getElementById('navOverlay');
  const navLinks = nav.querySelectorAll('.nav__link');

  function abrirMenu() {
    nav.classList.add('open');
    navOverlay.classList.add('visible');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function fecharMenu() {
    nav.classList.remove('open');
    navOverlay.classList.remove('visible');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  hamburger.addEventListener('click', () => {
    nav.classList.contains('open') ? fecharMenu() : abrirMenu();
  });
  navOverlay.addEventListener('click', fecharMenu);
  navLinks.forEach(link => link.addEventListener('click', () => {
    fecharMenu();
    navLinks.forEach(l => l.classList.remove('active-link'));
    link.classList.add('active-link');
  }));
  // fechar com a tecla ESC (acessibilidade / navegação por teclado)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharMenu();
  });

  /* ------------------------------------------------------------------------
     3. CARROSSEL DO PRATO PRINCIPAL (troca automática a cada 3 segundos)
  ------------------------------------------------------------------------ */
  const slideInterval = 3000; // <-- variável editável: intervalo de troca dos pratos (ms)

  const pratosDestaque = [
    { nome: 'Maniçoba',     image: 'manicoba.png', tag: ' "Feijoada paraense" ' },
    { nome: 'Pato no Tucupi', image: 'patonotucupi.png', tag: 'Tradição da Amazônia' },
    { nome: 'Tacacá',      image: 'tacaca.png', tag: 'Prato típico paraense' },
    { nome: 'Vatapá',      image: 'vatapa camarao.png', tag: 'Creme de camarão regional' },
  ];

  const dishDisplay = document.getElementById('dishDisplay');
  const dishLabel = document.getElementById('dishLabel');
  const dishIndicators = document.getElementById('dishIndicators');
  let dishIndex = 0;
  let dishTimer = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderDish(index) {
    const prato = pratosDestaque[index];

    // helper: cria e insere o wrapper com a imagem (após remoção do anterior)
    function insertNewWrap() {
      const wrap = document.createElement('div');
      wrap.className = 'dish-stage__dish-wrap';
      const img = document.createElement('img');
      img.src = encodeURI(prato.image);
      img.alt = prato.nome;
      img.loading = 'eager';
      wrap.appendChild(img);
      dishDisplay.appendChild(wrap);
      // forçar reflow antes de adicionar a classe de entrada para garantir animação
      void wrap.offsetWidth;
      wrap.classList.add('dish-enter');
    }

    // animação de saída do prato atual (se houver)
    const atual = dishDisplay.querySelector('.dish-stage__dish-wrap');
    if (atual) {
      atual.classList.remove('dish-enter');
      atual.classList.add('dish-exit');
      // quando a animação de saída terminar, remove o elemento e insere o novo
      const onAnimEnd = (e) => {
        if (e && e.target !== atual) return;
        atual.removeEventListener('animationend', onAnimEnd);
        if (atual.parentNode) atual.parentNode.removeChild(atual);
        insertNewWrap();
      };
      atual.addEventListener('animationend', onAnimEnd);
      // fallback caso 'animationend' não dispare (segurança)
      setTimeout(() => {
        if (atual.parentNode) {
          try { atual.removeEventListener('animationend', onAnimEnd); } catch (e) {}
          atual.parentNode.removeChild(atual);
        }
        // se já não tiver sido inserido, insere
        if (!dishDisplay.querySelector('.dish-stage__dish-wrap')) insertNewWrap();
      }, 700);
    } else {
      insertNewWrap();
    }

    // rótulo fica fora do elemento que gira, para permanecer sempre legível
    dishLabel.textContent = `${prato.nome} · ${prato.tag}`;
    dishLabel.classList.remove('label-pop');
    void dishLabel.offsetWidth; // força reflow para reiniciar a animação
    dishLabel.classList.add('label-pop');

    // atualiza indicadores
    [...dishIndicators.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function criarIndicadores() {
    dishIndicators.innerHTML = '';
    pratosDestaque.forEach((prato, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Mostrar prato: ${prato.nome}`);
      dot.addEventListener('click', () => {
        dishIndex = i;
        renderDish(dishIndex);
        reiniciarAutoPlay();
      });
      dishIndicators.appendChild(dot);
    });
  }

  function proximoPrato() {
    dishIndex = (dishIndex + 1) % pratosDestaque.length;
    renderDish(dishIndex);
  }

  function reiniciarAutoPlay() {
    if (dishTimer) clearInterval(dishTimer);
    if (!prefersReducedMotion) {
      dishTimer = setInterval(proximoPrato, slideInterval);
    }
  }

  criarIndicadores();
  renderDish(dishIndex);
  reiniciarAutoPlay();

  /* ------------------------------------------------------------------------
     3b. ANIMAÇÕES AO ROLAR A PÁGINA (IntersectionObserver)
     Definido aqui (antes do cardápio/galeria) pois esses módulos chamam
     observarElementos() ao renderizar seus itens dinamicamente.
  ------------------------------------------------------------------------ */
  let observer;
  function observarElementos() {
    if (!observer) {
      observer = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('in-view');
            observer.unobserve(entrada.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    }
    document.querySelectorAll('[data-animate]:not(.in-view)').forEach(el => observer.observe(el));
  }
  observarElementos();

  /* ------------------------------------------------------------------------
     4. CARDÁPIO — dados dos pratos, bebidas e sobremesas
  ------------------------------------------------------------------------ */
  const cardapio = {
    comidas: [
      { nome: 'Tacacá', desc: 'Caldo de tucupi com jambu, goma e camarão seco.', preco: 'R$ 22,00', emoji: '🍲', cores: CORES.verde },
      { nome: 'Pato no Tucupi', desc: 'Pato cozido no tucupi com jambu e arroz branco.', preco: 'R$ 48,00', emoji: '🦆', cores: CORES.azul },
      { nome: 'Maniçoba', desc: 'Folha de maniva moída cozida por dias com carnes defumadas.', preco: 'R$ 45,00', emoji: '🍛', cores: CORES.verdeClaro },
      { nome: 'Vatapá Paraense', desc: 'Creme de pão, camarão e dendê com toque amazônico.', preco: 'R$ 38,00', emoji: '🍤', cores: CORES.verde },
      { nome: 'Pirarucu', desc: 'O "bacalhau da Amazônia" grelhado com ervas regionais.', preco: 'R$ 52,00', emoji: '🐟', cores: CORES.azul },
      { nome: 'Filhote Frito', desc: 'Posta de peixe filhote frita, crocante por fora e macia por dentro.', preco: 'R$ 42,00', emoji: '🍽️', cores: CORES.verdeClaro },
      { nome: 'Caruru Paraense', desc: 'Quiabo, camarão seco e farinha no ponto certo do tempero.', preco: 'R$ 34,00', emoji: '🥘', cores: CORES.verde },
      { nome: 'Arroz Paraense', desc: 'Arroz temperado com jambu, camarão e toque de tucupi.', preco: 'R$ 26,00', emoji: '🍚', cores: CORES.azul },
    ],
    bebidas: [
      { nome: 'Açaí', desc: 'Servido puro ou com acompanhamentos regionais.', preco: 'R$ 16,00', emoji: '🫐', cores: CORES.verde },
      { nome: 'Suco de Cupuaçu', desc: 'Polpa de cupuaçu batida na hora, doce e refrescante.', preco: 'R$ 14,00', emoji: '🥤', cores: CORES.verdeClaro },
      { nome: 'Suco de Taperebá', desc: 'Fruta amazônica de sabor cítrico e marcante.', preco: 'R$ 14,00', emoji: '🧃', cores: CORES.azul },
      { nome: 'Suco de Graviola', desc: 'Sabor suave e adocicado, típico do Norte.', preco: 'R$ 14,00', emoji: '🥭', cores: CORES.verde },
      { nome: 'Guaraná', desc: 'Refrigerante genuinamente amazônico, gelado na medida.', preco: 'R$ 8,00', emoji: '🥤', cores: CORES.azul },
      { nome: 'Refresco de Bacuri', desc: 'Fruta rara da Amazônia em refresco cremoso.', preco: 'R$ 15,00', emoji: '🍹', cores: CORES.verdeClaro },
    ],
    sobremesas: [
      { nome: 'Açaí com Frutas', desc: 'Açaí cremoso com banana, morango e granola.', preco: 'R$ 18,00', emoji: '🍧', cores: CORES.verde },
      { nome: 'Creme de Cupuaçu', desc: 'Sobremesa gelada e aveludada de cupuaçu.', preco: 'R$ 16,00', emoji: '🍮', cores: CORES.verdeClaro },
      { nome: 'Sorvete de Bacuri', desc: 'Sorvete artesanal com a fruta símbolo do Pará.', preco: 'R$ 17,00', emoji: '🍨', cores: CORES.azul },
      { nome: 'Doce de Castanha', desc: 'Doce cremoso feito com castanha-do-pará.', preco: 'R$ 15,00', emoji: '🌰', cores: CORES.verde },
      { nome: 'Pudim de Cupuaçu', desc: 'Pudim macio com calda de cupuaçu amazônico.', preco: 'R$ 16,00', emoji: '🍰', cores: CORES.azul },
    ],
  };

  const menuGrid = document.getElementById('menuGrid');
  const menuTabs = document.querySelectorAll('.menu-tab');

  function renderMenu(categoria) {
    menuGrid.innerHTML = '';
    cardapio[categoria].forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'menu-card';
      card.style.animationDelay = `${i * 0.06}s`;
      card.setAttribute('data-animate', 'fade-up');

      const src = criarPlaceholder(item.emoji, item.cores[0], item.cores[1]);
      card.innerHTML = `
        <div class="menu-card__image">
          <img src="${src}" alt="${item.nome}" loading="lazy" width="600" height="450">
        </div>
        <div class="menu-card__body">
          <h3>${item.nome}</h3>
          <p>${item.desc}</p>
          <div class="menu-card__footer">
            <span class="menu-card__price">${item.preco}</span>
            <button class="menu-card__order" type="button">PEDIR</button>
          </div>
        </div>
      `;
      menuGrid.appendChild(card);
    });
    observarElementos(); // reobserva os novos cards para animação ao rolar
    // já visíveis (a seção pode já estar em tela ao trocar de aba)
    requestAnimationFrame(() => {
      menuGrid.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
    });
  }

  menuTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      menuTabs.forEach(t => t.classList.remove('active-tab'));
      tab.classList.add('active-tab');
      renderMenu(tab.dataset.category);
    });
  });

  renderMenu('comidas');

  // clique em "PEDIR" — feedback simples via WhatsApp
  menuGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('menu-card__order')) {
      const nomePrato = e.target.closest('.menu-card').querySelector('h3').textContent;
      const numero = '5593984118677';
      const texto = encodeURIComponent(`Olá! Gostaria de pedir: ${nomePrato}`);
      window.open(`https://wa.me/${numero}?text=${texto}`, '_blank', 'noopener');
    }
  });

  /* ------------------------------------------------------------------------
     5. GALERIA
  ------------------------------------------------------------------------ */
  const itensGaleria = [
    { nome: 'Tacaca servido na cuia', image: 'tacaca.png' },
    { nome: 'Acai na tigela', image: 'galeriaimage.jpg' },
    { nome: 'Pato no tucupi', image: 'patonotucupi.png' },
    { nome: 'Manicoba', image: 'manicoba.png' },
    { nome: 'Ingredientes amazonicos', image: 'galeriaimages.jpg' },
    { nome: 'Ambiente do restaurante', image: 'sobre.png' },
    { nome: 'Vatapa amazonico', image: 'vatapa camarao.png' },
    { nome: 'Prato e cultura', image: 'galeriaimages.jpg' },
  ];

  const galleryGrid = document.getElementById('galleryGrid');
  itensGaleria.forEach((item, i) => {
    const fig = document.createElement('figure');
    fig.className = 'gallery__item' + (i === 0 ? ' gallery__item--wide' : '');
    fig.setAttribute('data-animate', 'scale-in');

    const img = document.createElement('img');
    img.src = encodeURI(item.image);
    img.alt = item.nome;
    img.loading = 'lazy';
    img.width = 600;
    img.height = 450;
    fig.appendChild(img);

    fig.addEventListener('click', () => abrirModal(img.src, item.nome));
    galleryGrid.appendChild(fig);
  });
  observarElementos(); // registra os itens da galeria para animação ao rolar

  /* Modal da galeria */
  const modal = document.getElementById('galleryModal');
  const modalImage = document.getElementById('modalImage');
  const modalCaption = document.getElementById('modalCaption');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');

  function abrirModal(src, legenda) {
    modalImage.src = src;
    modalImage.alt = legenda;
    modalCaption.textContent = legenda;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function fecharModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  modalClose.addEventListener('click', fecharModal);
  modalOverlay.addEventListener('click', fecharModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

  /* ------------------------------------------------------------------------
     7. BOTÃO VOLTAR AO TOPO
  ------------------------------------------------------------------------ */
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------------
     8. NAVEGAÇÃO ATIVA CONFORME A SEÇÃO VISÍVEL
  ------------------------------------------------------------------------ */
  const secoes = document.querySelectorAll('main section[id]');
  const linksNav = document.querySelectorAll('.nav__link');

  const sectionObserver = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        const id = entrada.target.getAttribute('id');
        linksNav.forEach(link => {
          link.classList.toggle('active-link', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  secoes.forEach(sec => sectionObserver.observe(sec));

});
