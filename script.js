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

  // --- Background loading (works for all pages) ---
  window.addEventListener('load', function() {
    const bg = document.getElementById('bg');
    const bgFallback = document.getElementById('bgFallback');
    
    // Determine correct path to background based on nesting level
    const currentPath = window.location.pathname;
    let bgPath = 'background.png';
    
    // If we're in a subfolder (Photos or Projects)
    if (currentPath.includes('/Photos/') || currentPath.includes('/Projects/')) {
      bgPath = '../background.png';
    }
    
    const img = new Image();
    img.src = bgPath;

    img.onload = function() {
      if (bg) {
        bg.style.backgroundImage = `url('${bgPath}')`;
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

  // --- Tab Navigation ---
  const tabButtons = document.querySelectorAll('.tab-button, .tab-button-active');
  
  // Determine current page
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

    // Determine which tab this is based on data-url
    let targetPage = 'home';
    if (dataUrl.includes('Photos')) targetPage = 'photos';
    else if (dataUrl.includes('Projects')) targetPage = 'projects';

    // Highlight active tab
    if (targetPage === currentPage) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }

    // Navigation on click
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Don't navigate if already on this page
      if (targetPage === currentPage) return;

      // Build path based on current location
      let targetPath;
      
      if (currentPage === 'home') {
        // From home: go directly to subfolder
        targetPath = dataUrl; // "Photos/index.html"
      } else if (targetPage === 'home') {
        // From subfolder to home: go up one level
        targetPath = '../index.html';
      } else {
        // From subfolder to subfolder: go up then to target
        targetPath = '../' + dataUrl; // "../Photos/index.html"
      }
      
      window.location.href = targetPath;
    });
  });

  // --- Functional windows (Search/Info) ---
  const funcWrappers = document.querySelectorAll('.func-wrapper');

  funcWrappers.forEach(wrapper => {
    const input = wrapper.querySelector('#search-input');
    
    // Autofocus on hover (only for desktop)
    if (window.innerWidth > 768) {
      wrapper.addEventListener('mouseenter', () => {
        if (input) {
          setTimeout(() => input.focus(), 300);
        }
      });

      wrapper.addEventListener('mouseleave', () => {
        if (input) input.blur();
      });
    }

    // Click handler
    const btn = wrapper.querySelector('.func-button');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other popovers
        funcWrappers.forEach(other => {
          if (other !== wrapper) other.classList.remove('active');
        });
        
        // Toggle current popover
        const wasActive = wrapper.classList.contains('active');
        wrapper.classList.toggle('active');
        
        // Focus search input when opened
        if (!wasActive && input && wrapper.classList.contains('active')) {
          setTimeout(() => input.focus(), 100);
        }
      });
    }
  });

  // Close popovers when clicking outside
  document.addEventListener('click', (e) => {
    const clickedInside = Array.from(funcWrappers).some(wrapper => {
      return wrapper.contains(e.target);
    });
    
    if (!clickedInside) {
      funcWrappers.forEach(w => w.classList.remove('active'));
    }
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
