(function() {
  const CURRENT_USER_KEY = 'unimercs_current_user';
  const EXPLORE_STORAGE_KEY = 'unimercs_explore_products';
  const POSTS_STORAGE_KEY = 'mh_user_posts';

  let currentSession = null;
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let searchTerm = '';

  const toastEl = document.getElementById('toast');
  const productsGrid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  

  const userInfoDiv = document.getElementById('user-info');
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const logoutBtn = document.getElementById('logout-btn');


  function loadSession() {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        currentSession = JSON.parse(stored);
        if (currentSession && currentSession.name) {
          userInfoDiv.textContent = `Hola, ${currentSession.name}`;
          loginLink.style.display = 'none';
          registerLink.style.display = 'none';
          logoutBtn.style.display = 'block';
        }
      } else {
        const session2 = localStorage.getItem('session');
        if (session2) {
          currentSession = JSON.parse(session2);
          userInfoDiv.textContent = `Hola, ${currentSession.name}`;
          loginLink.style.display = 'none';
          registerLink.style.display = 'none';
          logoutBtn.style.display = 'block';
        } else {
          userInfoDiv.style.display = 'none';
          logoutBtn.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Error loading session', e);
    }
  }

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('session');
    window.location.reload();
  });


  const profileBtn = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-dropdown-menu');
  profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (profileMenu.hasAttribute('hidden')) {
      profileMenu.removeAttribute('hidden');
    } else {
      profileMenu.setAttribute('hidden', '');
    }
  });

  document.addEventListener('click', (e) => {
    if (profileMenu && !profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
      profileMenu.setAttribute('hidden', '');
    }
  });


  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.removeAttribute('hidden');
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.setAttribute('hidden', ''), 300);
    }, 2500);
  }

  function formatPrice(num) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
  }

  function getCategoryLabel(val) {
    const map = {
      'electronics': 'Electrónicos',
      'computers': 'Computadoras',
      'fashion': 'Moda',
      'home': 'Casa',
      'books': 'Libros',
      'games': 'Videojuegos'
    };
    return map[val] || val;
  }

  function getConditionLabel(val) {
    if (val === 'new') return 'Nuevo';
    if (val === 'barely used') return 'Como Nuevo';
    if (val === 'used') return 'Usado';
    return val;
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  }


  function loadProducts() {
    try {
      const stored = localStorage.getItem(EXPLORE_STORAGE_KEY);
      if (stored) {
        allProducts = JSON.parse(stored);
      } else {

        allProducts = [
          {
            id: '1001',
            title: 'MacBook Pro M1 2020 8GB/256GB',
            price: 3500000,
            category: 'computers',
            condition: 'barely used',
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            username: 'Estudiante Ejemplo',
            badge: 'Destacado'
          },
          {
            id: '1002',
            title: 'Calculadora Gráfica TI-Nspire CX II',
            price: 600000,
            category: 'electronics',
            condition: 'used',
            image: 'https://images.unsplash.com/photo-1574483751717-36e2f1eebd10?auto=format&fit=crop&w=800&q=80',
            username: 'Juan Pérez',
            badge: 'Oferta'
          }
        ];
      }
    } catch(e) {
      allProducts = [];
    }
    applyFilters();
  }


  function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    
    resultsCount.textContent = filteredProducts.length;

    if (filteredProducts.length === 0) {
      emptyState.removeAttribute('hidden');
    } else {
      emptyState.setAttribute('hidden', '');
      
      filteredProducts.forEach(product => {
        const isOwner = currentSession && product.username === currentSession.name;
        
        let ownerActionsHTML = '';
        if (isOwner) {
          ownerActionsHTML = `
            <div class="owner-actions">
              <button class="action-btn action-edit" title="Editar" data-id="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="action-btn action-delete" title="Eliminar" data-id="${product.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          `;
        }

        const badgeHtml = product.badge ? `<div class="badge">${product.badge}</div>` : '';
        const safeImage = product.image || 'https://via.placeholder.com/400x300?text=No+Image';

        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
          ${ownerActionsHTML}
          <div class="product-image-wrap">
            ${badgeHtml}
            <img src="${safeImage}" alt="${product.title}" class="product-image" loading="lazy">
          </div>
          <div class="product-content">
            <span class="product-category">${getCategoryLabel(product.category)}</span>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-meta">
              <span class="product-seller">
                <span class="avatar-mini">${getInitials(product.username)}</span>
                ${product.username}
              </span>
              <span>${getConditionLabel(product.condition)}</span>
            </div>
          </div>
        `;
        productsGrid.appendChild(card);
      });
      
      attachCardEvents();
    }
  }

  function attachCardEvents() {
    document.querySelectorAll('.action-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        confirmDelete(id);
      });
    });

    document.querySelectorAll('.action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });
  }

  function applyFilters() {
    filteredProducts = allProducts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
    renderProducts();
  }

  const searchInput = document.getElementById('global-search');
  const searchBtn = document.getElementById('search-desktop-btn');

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    applyFilters();
  });

  searchBtn?.addEventListener('click', () => {
    searchTerm = searchInput.value.trim();
    applyFilters();
  });

  const categoryContainer = document.getElementById('category-filters');
  const catBtns = document.querySelectorAll('.cat-btn');
  
  categoryContainer?.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-btn')) {
      catBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.getAttribute('data-category');
      applyFilters();
    }
  });

  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    searchTerm = '';
    searchInput.value = '';
    activeCategory = 'all';
    catBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-category="all"]').classList.add('active');
    applyFilters();
  });


  // 4

  function deleteFromStorage(id) {

    allProducts = allProducts.filter(p => String(p.id) !== String(id));
    localStorage.setItem(EXPLORE_STORAGE_KEY, JSON.stringify(allProducts));
    

    try {
      const rawUserPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      if (rawUserPosts) {
        let userPosts = JSON.parse(rawUserPosts);
        userPosts = userPosts.filter(p => String(p.id) !== String(id));
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(userPosts));
      }
    } catch(err) {
      console.error(err);
    }
  }

  function confirmDelete(id) {
    if (confirm("¿Estás seguro de que deseas eliminar tu publicación? Esta acción no se puede deshacer.")) {
      deleteFromStorage(id);
      applyFilters(); // Re-render
      showToast("Publicación eliminada correctamente.");
    }
  }


  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const backdrop = document.getElementById('modal-backdrop');

  const editId = document.getElementById('edit-id');
  const editTitle = document.getElementById('edit-title');
  const editCategory = document.getElementById('edit-category');
  const editState = document.getElementById('edit-state');
  const editPrice = document.getElementById('edit-price');

  function openEditModal(id) {
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) return;


    editId.value = product.id;
    editTitle.value = product.title || '';
    editPrice.value = product.price || '';
    
    if (product.category) editCategory.value = product.category;
    if (product.condition) editState.value = product.condition;

    editModal.removeAttribute('hidden');
  }

  function closeEditModal() {
    editModal.setAttribute('hidden', '');
    editForm.reset();
  }

  closeModalBtn?.addEventListener('click', closeEditModal);
  cancelEditBtn?.addEventListener('click', closeEditModal);
  backdrop?.addEventListener('click', closeEditModal);

  editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editId.value;
    const newTitle = editTitle.value.trim();
    const newPrice = Number(editPrice.value.trim());
    const newCategory = editCategory.value;
    const newState = editState.value;

    if (!newTitle || newPrice <= 0) {
      showToast("Por favor revisa los campos ingresados");
      return;
    }

    const prodIdx = allProducts.findIndex(p => String(p.id) === String(id));
    if (prodIdx > -1) {
      allProducts[prodIdx] = {
        ...allProducts[prodIdx],
        title: newTitle,
        price: newPrice,
        category: newCategory,
        condition: newState
      };
      localStorage.setItem(EXPLORE_STORAGE_KEY, JSON.stringify(allProducts));
    }

    try {
      const rawUserPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      if (rawUserPosts) {
        let userPosts = JSON.parse(rawUserPosts);
        const userProdIdx = userPosts.findIndex(p => String(p.id) === String(id));
        if (userProdIdx > -1) {
          userPosts[userProdIdx] = {
            ...userPosts[userProdIdx],
            title: newTitle,
            price: newPrice,
            category: newCategory,
            state: newState
          };
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(userPosts));
        }
      }
    } catch(err) {
      console.error(err);
    }

    closeEditModal();
    applyFilters();
    showToast("Cambios guardados con éxito.");
  });

  function init() {
    loadSession();
    loadProducts();
  }

  init();

})();
