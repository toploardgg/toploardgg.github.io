(function() {
  'use strict';

  // --- Hover lifting animations ---
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

  // --- Background loading ---
  window.addEventListener('load', function() {
    const bg = document.getElementById('bg');
    const bgFallback = document.getElementById('bgFallback');
    const img = new Image();

    img.src = 'background.png';

    img.onload = function() {
      if (bg) {
        bg.style.backgroundImage = `url('background.png')`;
        bg.style.opacity = '0.5';
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

// --- Tabs ---
const tabButtons = document.querySelectorAll('.tab-button');
  const currentPath = window.location.pathname.split('/').pop(); // текущий файл

tabButtons.forEach(button => {
    let target = button.getAttribute('data-url');
    if (!target) return;

    if (target.startsWith('/')) target = target.slice(1);

    // переход по клику
    button.addEventListener('click', () => {
      const resolved = new URL(target, window.location.href);
      window.location.href = resolved.href;
    });
  });

  // --- Func wrappers ---
  const funcWrappers = document.querySelectorAll('.func-wrapper');

  funcWrappers.forEach(wrapper => {
    const button = wrapper.querySelector('.func-button');
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.classList.toggle('active');
    });
  });

  document.addEventListener('click', () => {
    funcWrappers.forEach(wrapper => {
      wrapper.classList.remove('active');
    });
});

  // --- Search with highlight ---
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
          const excludeTags = ['SCRIPT', 'STYLE', 'HEADER'];
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
