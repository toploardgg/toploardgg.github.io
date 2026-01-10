(function() {
  'use strict';

  // --- Hover Effects ---
  const hoverMap = {
    'card': 'hover-lift-card',
    'project': 'hover-lift-project',
    'badge': 'hover-lift-small',
    'skill': 'hover-lift-small',
    'button': 'hover-lift-small',
    'contact-item': 'hover-lift-contact'
  };

  document.querySelectorAll('.card, .project, .badge, .skill, .contact-item, .button').forEach(el => {
    const hoverClass = Object.keys(hoverMap).find(key => el.classList.contains(key));
    if (hoverClass) {
      el.addEventListener('mouseenter', () => el.classList.add(hoverMap[hoverClass]));
      el.addEventListener('mouseleave', () => el.classList.remove(hoverMap[hoverClass]));
    }
  });

  // --- Background Loading ---
  window.addEventListener('load', () => {
    const bg = document.getElementById('bg');
    const bgFallback = document.getElementById('bgFallback');
    
    const img = new Image();
    img.src = 'background.png';
    img.onload = () => {
      if (bg) {
        bg.style.backgroundImage = `url('background.png')`;
        bg.style.animation = 'bgFadeIn 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      }
      if (bgFallback) {
        bgFallback.style.transition = 'opacity 1s ease';
        bgFallback.style.opacity = '0';
        setTimeout(() => bgFallback.style.display = 'none', 1000);
      }
    };
    img.onerror = () => {
      if (bg) bg.style.display = 'none';
      if (bgFallback) bgFallback.style.display = 'block';
    };
  });

  // Add background animation CSS dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bgFadeIn {
      from { opacity: 0; }
      to { opacity: 0.8; }
    }
    
    /* Floating particles */
    .particle {
      position: fixed;
      width: 4px;
      height: 4px;
      background: radial-gradient(circle, rgba(255,255,255,0.8), transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      animation: float linear infinite;
    }
    
    @keyframes float {
      0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-100vh) translateX(-50px) scale(0.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Create floating particles
  function createParticles() {
    const particleCount = 15;
    const scene = document.querySelector('.scene');
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${15 + Math.random() * 15}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particle.style.width = `${2 + Math.random() * 4}px`;
      particle.style.height = particle.style.width;
      scene.appendChild(particle);
    }
  }

  // Initialize particles after a short delay
  setTimeout(createParticles, 1000);

  // --- Tab Navigation ---
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.tab-button');
    let isScrolling = false;

    const sections = Array.from(buttons)
      .map(btn => {
        const target = btn.getAttribute('data-target');
        return document.querySelector('.' + target) || document.querySelector('#' + target);
      })
      .filter(sec => sec !== null);

    const setActiveTab = (targetClass) => {
      buttons.forEach(btn => {
        btn.classList.toggle('tab-button-active', btn.getAttribute('data-target') === targetClass);
      });
    };

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetClass = button.getAttribute('data-target');
        const targetElement = document.querySelector('.' + targetClass) || document.querySelector('#' + targetClass);

        if (targetElement) {
          isScrolling = true;
          setActiveTab(targetClass);
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => isScrolling = false, 1000);
        }
      });
    });

    const observer = new IntersectionObserver((entries) => {
      if (isScrolling) return;

      let maxRatio = 0;
      let bestEntry = null;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          bestEntry = entry;
        }
      });

      if (bestEntry) {
        const matchingBtn = Array.from(buttons).find(btn => {
          const target = btn.getAttribute('data-target');
          return bestEntry.target.classList.contains(target) || bestEntry.target.id === target;
        });

        if (matchingBtn) setActiveTab(matchingBtn.getAttribute('data-target'));
      }
    }, {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    });

    sections.forEach(section => observer.observe(section));

    const checkInitialPosition = () => {
      const scrollPosition = window.scrollY + (window.innerHeight / 3);
      sections.forEach(sec => {
        const top = sec.offsetTop;
        const bottom = top + sec.offsetHeight;
        if (scrollPosition >= top && scrollPosition <= bottom) {
          const targetClass = Array.from(buttons).find(btn => {
            const t = btn.getAttribute('data-target');
            return sec.classList.contains(t) || sec.id === t;
          });
          if (targetClass) setActiveTab(targetClass.getAttribute('data-target'));
        }
      });
    };

    checkInitialPosition();
  });

  // --- Functional Popovers (Search/Info) ---
  const isMobile = () => window.innerWidth <= 768;
  const funcWrappers = document.querySelectorAll('.func-wrapper');

  funcWrappers.forEach(wrapper => {
    const input = wrapper.querySelector('#search-input');
    const btn = wrapper.querySelector('.func-button');
    const popover = wrapper.querySelector('.popover, .search-popover, .info-popover');

    wrapper.addEventListener('mouseenter', () => {
      if (input && !isMobile()) setTimeout(() => input.focus(), 300);
    });

    wrapper.addEventListener('mouseleave', () => {
      if (input && !isMobile()) input.blur();
      // НЕ очищаем подсветку при отведении мыши
    });

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const wasActive = wrapper.classList.contains('active');
        
        if (!wasActive) {
          funcWrappers.forEach(w => w.classList.remove('active'));
          wrapper.classList.add('active');
          if (input) setTimeout(() => input.focus(), 100);
        } else {
          // Очистка подсветки ТОЛЬКО при закрытии окна поиска
          wrapper.classList.remove('active');
          if (input) {
            clearHighlight();
            input.value = '';
          }
        }
      });
    }

    if (popover) {
      popover.addEventListener('click', (e) => e.stopPropagation());
    }
  });

  document.addEventListener('click', () => {
    // Очистка подсветки ТОЛЬКО при закрытии окна (клик вне)
    const searchWrapper = document.querySelector('.func-wrapper.left');
    const searchInput = document.getElementById('search-input');
    
    if (searchWrapper && searchWrapper.classList.contains('active')) {
      searchWrapper.classList.remove('active');
      if (searchInput) {
        clearHighlight();
        searchInput.value = '';
      }
    }
    
    funcWrappers.forEach(w => w.classList.remove('active'));
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) funcWrappers.forEach(w => w.classList.remove('active'));
  });

  // --- Search Functionality ---
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const clearHighlight = () => {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  };

  const highlightSearch = (term) => {
    clearHighlight();
    if (!term.trim()) return;

    const regex = new RegExp(`(${escapeRegExp(term.trim())})`, 'gi');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => ['SCRIPT', 'STYLE', 'HEADER', 'BUTTON', 'INPUT'].includes(node.parentNode.tagName) 
        ? NodeFilter.FILTER_REJECT 
        : NodeFilter.FILTER_ACCEPT
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
  };

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => highlightSearch(e.target.value));
  }

  // --- Site Loader ---
  document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('site-loader');
    if (!loader) return;

    document.body.style.overflow = 'hidden';

    const MIN_SHOW = 3000;
    const start = Date.now();

    window.addEventListener('load', () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_SHOW - elapsed);

      setTimeout(() => {
        loader.classList.add('reverse');
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.style.overflow = '';
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 200);
      }, remaining);
    });
  });
  (function() {
    const updateThemeColor = () => {
      const bgColor = "#333333"; 
      
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', bgColor);
    };

    // Запуск при загрузке и смене ориентации экрана
    window.addEventListener('load', updateThemeColor);
    window.addEventListener('orientationchange', updateThemeColor);
  })();

})();
