const state = {
  activeCategory: 'todos',
  products: []
};

const elements = {
  productGrid: document.getElementById('productGrid'),
  emptyState: document.getElementById('emptyState'),
  tabs: Array.from(document.querySelectorAll('.tab')),
  searchInput: document.getElementById('searchInput'),
  year: document.getElementById('year'),
  menuToggle: document.getElementById('menuToggle'),
  mainNav: document.getElementById('mainNav')
};

const categoryMap = {
  caminhao: 'Caminhão',
  carro: 'Carro',
  moto: 'Moto',
  onibus: 'Ônibus',
  tratores: 'Trator'
};

const fetchProducts = async () => {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Não foi possível carregar os produtos.');
  }

  const products = await response.json();
  state.products = products;
  renderProducts();
};

const filteredProducts = () => {
  const term = elements.searchInput.value.trim().toLowerCase();

  return state.products.filter((product) => {
    const matchesCategory = state.activeCategory === 'todos' || product.category === state.activeCategory;
    const haystack = `${product.title} ${product.description} ${categoryMap[product.category] || product.category} ${product.status}`.toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    return matchesCategory && matchesSearch;
  });
};

const renderProducts = () => {
  const products = filteredProducts();

  if (!products.length) {
    elements.productGrid.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');
  elements.productGrid.innerHTML = products.map((product) => `
    <article class="product-card">
      <div class="product-photo">
        <img src="${product.image || 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80'}" alt="${product.title}" onerror="this.src='https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80';" />
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span class="product-badge">${categoryMap[product.category] || product.category}</span>
          <span class="product-stock ${product.stock > 0 ? 'stock-ok' : 'stock-zero'}">${product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}</span>
        </div>
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <span class="status ${product.status === 'disponível' ? 'status-ok' : 'status-ordered'}">${product.status}</span>
        </div>
        <div class="product-actions">
          <a class="product-link" href="https://wa.me/5587999005001?text=${encodeURIComponent(`Olá, Paraibana Peças! Gostaria de saber mais sobre ${product.title}.`)}" target="_blank" rel="noopener noreferrer">Consultar no WhatsApp</a>
        </div>
      </div>
    </article>
  `).join('');
};

const setActiveTab = (category) => {
  state.activeCategory = category;
  elements.tabs.forEach((tab) => {
    const active = tab.dataset.category === category;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  renderProducts();
};

elements.tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveTab(tab.dataset.category));
});

elements.searchInput.addEventListener('input', renderProducts);

elements.menuToggle.addEventListener('click', () => {
  const open = elements.mainNav.classList.toggle('open');
  elements.menuToggle.setAttribute('aria-expanded', String(open));
  elements.menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

elements.mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    elements.mainNav.classList.remove('open');
    elements.menuToggle.setAttribute('aria-expanded', 'false');
    elements.menuToggle.setAttribute('aria-label', 'Abrir menu');
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

fetchProducts().catch((error) => {
  elements.productGrid.innerHTML = '<div class="catalog-error">' + error.message + '</div>';
});
