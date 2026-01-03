(function() {
  'use strict';

  // --- 1. Анимации при наведении (Hover lifting) ---
  const hoverElements = document.querySelectorAll('.card, .project, .badge, .skill, .contact-item, .button');

  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (el.classList.contains('card')) {
        el.classList.add('hover-lift-card');
      } else if (el.classList.contains('project')) {
        el.classList.add('hover-lift-project');
      } else if (el.classList.contains('badge') || el.classList.contains('skill') || el.classList.contains('button')) {
        el.classList.add('hover-lift-small');
      } else if (el.classList.contains('contact-item')) {
        el.classList.add('hover-lift-contact');
      }
    });

    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-lift-card', 'hover-lift-project', 'hover-lift-small', 'hover-lift-contact');
    });
  });

  // --- 2. Загрузка фона (исправление путей и прозрачности) ---
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
        bg.style.opacity = '0.8'; // Сделали чуть ярче по вашему коду
      }
      if (bgFallback) {
        bgFallback.style.display = 'none';
      }
    };

    img.onerror = function() {
      if (bg) bg.style.display = 'none';
      if (bgFallback) bgFallback.style.display = 'block';
    };
  });

  // --- 3. Навигация по табам (Smart Tab Navigation) ---
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

    button.classList.remove('active');
    if (targetPage === currentPage) {
      button.classList.add('active');
    }

    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (targetPage === currentPage) return;

      let targetPath;
      if (currentPage === 'home') {
        targetPath = dataUrl;
      } else if (targetPage === 'home') {
        targetPath = '../index.html';
      } else {
        targetPath = '../' + dataUrl;
      }
      window.location.href = targetPath;
    });
  });

  // --- 4. Функциональные окна (Поиск/Инфо) ---
  // ИСПРАВЛЕНО: Теперь закрываются при повторном клике
  const funcWrappers = document.querySelectorAll('.func-wrapper');

  funcWrappers.forEach(wrapper => {
    const input = wrapper.querySelector('#search-input');
    const btn = wrapper.querySelector('.func-button');
    
    // Фокус для ПК
    if (window.innerWidth > 768) {
      wrapper.addEventListener('mouseenter', () => {
        if (input) setTimeout(() => input.focus(), 300);
      });
      wrapper.addEventListener('mouseleave', () => {
        if (input) input.blur();
      });
    }

    // Клик для мобильных и ПК (переключение)
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Важно, чтобы не срабатывал клик по документу
        
        const isActive = wrapper.classList.contains('active');

        // Закрываем все остальные окна
        funcWrappers.forEach(other => {
          if (other !== wrapper) other.classList.remove('active');
        });

        // Переключаем текущее (если было открыто — закроется, если нет — откроется)
        if (isActive) {
          wrapper.classList.remove('active');
          if (input) input.blur();
        } else {
          wrapper.classList.add('active');
          if (input) setTimeout(() => input.focus(), 100);
        }
      });
    }

    // Запрещаем закрытие при клике ВНУТРИ самого окна (например, на текст или инпут)
    const popover = wrapper.querySelector('.popover, .search-popover, .info-popover');
    if (popover) {
      popover.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });

  // Закрытие окон при клике в любое место экрана (вне кнопок)
  document.addEventListener('click', () => {
    funcWrappers.forEach(w => w.classList.remove('active'));
  });

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

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: node => {
          const excludeTags = ['SCRIPT', 'STYLE', 'HEADER', 'BUTTON', 'INPUT'];
          if (excludeTags.includes(node.parentNode.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      if (regex.test(textNode.nodeValue)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = textNode.nodeValue.replace(regex, '<mark class="search-highlight">$1</mark>');
        while (tempDiv.firstChild) {
          textNode.parentNode.insertBefore(tempDiv.firstChild, textNode);
        }
        textNode.parentNode.removeChild(textNode);
      }
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      highlightSearch(e.target.value);
    });
  }

})();
