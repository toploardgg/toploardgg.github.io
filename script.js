(function() {
  'use strict';

  // --- 1. Анимации при наведении (Hover lifting) ---
  const hoverElements = document.querySelectorAll('.card, .project, .badge, .skill, .contact-item, .button');

  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (el.classList.contains('card')) el.classList.add('hover-lift-card');
      else if (el.classList.contains('project')) el.classList.add('hover-lift-project');
      else if (el.classList.contains('badge') || el.classList.contains('skill') || el.classList.contains('button')) el.classList.add('hover-lift-small');
      else if (el.classList.contains('contact-item')) el.classList.add('hover-lift-contact');
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-lift-card', 'hover-lift-project', 'hover-lift-small', 'hover-lift-contact');
    });
  });

  // --- 2. Загрузка фона ---
  window.addEventListener('load', function() {
    const bg = document.getElementById('bg');
    const bgFallback = document.getElementById('bgFallback');
    const currentPath = window.location.pathname;
    let bgPath = 'background.png';
    
    if (currentPath.includes('/Photos/') || currentPath.includes('/Projects/')) {
      bgPath = '../background.png';
    }
    
    const img = new Image();
    img.src = bgPath;
    img.onload = function() {
      if (bg) {
        bg.style.backgroundImage = `url('${bgPath}')`;
        bg.style.opacity = '0.8';
      }
      if (bgFallback) bgFallback.style.display = 'none';
    };
    img.onerror = function() {
      if (bg) bg.style.display = 'none';
      if (bgFallback) bgFallback.style.display = 'block';
    };
  });

  // --- 3. Навигация по табам ---
  const tabButtons = document.querySelectorAll('.tab-button, .tab-button-active');
  const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path.includes('/Photos/')) return 'photos';
    if (path.includes('/Projects/')) return 'projects';
    return 'home';
  };
  const currentPage = getCurrentPage();

  tabButtons.forEach(button => {
    const dataUrl = button.getAttribute('data-url');
    if (!dataUrl) return;

    let targetPage = 'home';
    if (dataUrl.includes('Photos')) targetPage = 'photos';
    else if (dataUrl.includes('Projects')) targetPage = 'projects';

    button.classList.toggle('active', targetPage === currentPage);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (targetPage === currentPage) return;
      let targetPath = (currentPage === 'home') ? dataUrl : (targetPage === 'home' ? '../index.html' : '../' + dataUrl);
      window.location.href = targetPath;
    });
  });

  // --- 4. Функциональные окна (Поиск/Инфо) ---
  const funcWrappers = document.querySelectorAll('.func-wrapper');

  funcWrappers.forEach(wrapper => {
    const input = wrapper.querySelector('#search-input');
    const btn = wrapper.querySelector('.func-button');
    const popover = wrapper.querySelector('.popover, .search-popover, .info-popover');

    // Фокус для ПК при наведении
    if (window.innerWidth > 768) {
      wrapper.addEventListener('mouseenter', () => {
        if (input) setTimeout(() => input.focus(), 300);
      });
      wrapper.addEventListener('mouseleave', () => {
        if (input) input.blur();
      });
    }

    // Логика клика (Открыть/Закрыть)
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isActive = wrapper.classList.contains('active');

        // Закрываем все другие окна
        funcWrappers.forEach(other => other.classList.remove('active'));

        // Переключаем текущее
        if (!isActive) {
          wrapper.classList.add('active');
          if (input) setTimeout(() => input.focus(), 100);
        } else {
          wrapper.classList.remove('active');
          if (input) input.blur();
        }
      });
    }

    // Остановка всплытия клика внутри окна (чтобы не закрывалось при вводе текста)
    if (popover) {
      popover.addEventListener('click', (e) => e.stopPropagation());
    }
  });

  // УМНОЕ ЗАКРЫТИЕ (Блокировка ссылок при активном окне)
  document.addEventListener('click', (e) => {
    const activeWrapper = document.querySelector('.func-wrapper.active');
    if (activeWrapper) {
      // Если клик был вне активного окна
      if (!activeWrapper.contains(e.target)) {
        // Если это была ссылка — отменяем переход
        if (e.target.closest('a')) {
          e.preventDefault();
        }
        // Закрываем окно
        activeWrapper.classList.remove('active');
      }
    }
  }, true); // true активирует стадию перехвата

  // --- 5. Поиск с подсветкой ---
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearHighlight() {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function highlightSearch(term) {
    clearHighlight();
    if (!term.trim()) return;
    const regex = new RegExp(`(${escapeRegExp(term.trim())})`, 'gi');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => ['SCRIPT', 'STYLE', 'HEADER', 'BUTTON', 'INPUT'].includes(node.parentNode.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) textNodes.push(node);

    textNodes.forEach(textNode => {
      if (regex.test(textNode.nodeValue)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = textNode.nodeValue.replace(regex, '<mark class="search-highlight">$1</mark>');
        while (tempDiv.firstChild) textNode.parentNode.insertBefore(tempDiv.firstChild, textNode);
        textNode.parentNode.removeChild(textNode);
      }
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => highlightSearch(e.target.value));
  }

})();
