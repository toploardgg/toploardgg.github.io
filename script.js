// ─────────────────────────────────────────
// Theme Toggle
// ─────────────────────────────────────────
const themeBtn = document.querySelector(".theme-btn");

if (themeBtn) {
  const updateIcon = (isLight) => {
    themeBtn.innerHTML = isLight
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  };
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.body.classList.add("light");
    updateIcon(true);
  } else {
    updateIcon(false);
  }
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    updateIcon(isLight);
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });
}

// ─────────────────────────────────────────
// Toast
// ─────────────────────────────────────────
function showToast(msg, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  if (!document.querySelector("#toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `
      @keyframes toastIn{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
      @keyframes toastOut{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,20px)}}
      .toast{
        position:fixed;
        bottom:28px;
        left:50%;
        transform:translateX(-50%);
        z-index:99999;
        display:flex;
        align-items:center;
        gap:14px;
        padding:13px 10px 13px 20px;
        border-radius:18px;
        font-size:13px;
        font-weight:600;
        color:rgba(233,238,248,0.92);
        background:rgba(255,255,255,0.06);
        backdrop-filter:blur(24px);
        -webkit-backdrop-filter:blur(24px);
        border:1px solid rgba(255,255,255,0.13);
        box-shadow:0 8px 32px rgba(0,0,0,0.3);
        animation:toastIn .38s cubic-bezier(0.34,1.56,0.64,1) both;
        white-space:nowrap;
        min-width:220px;
        max-width:90vw;
      }
      .toast--error{border-color:rgba(255,100,100,0.22);color:rgba(255,180,180,0.95)}
      .toast__icon{font-size:15px;flex-shrink:0;opacity:0.75}
      .toast__msg{flex:1;line-height:1.4;white-space:normal}
      .toast__close{
        flex-shrink:0;
        width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.05);
        color:rgba(255,255,255,0.45);
        font-size:13px;
        cursor:pointer;
        transition:background .2s,color .2s,border-color .2s;
        padding:0;
        -webkit-tap-highlight-color:transparent;
        touch-action:manipulation;
      }
      .toast__close:hover,.toast__close:active{
        background:rgba(255,255,255,0.12);
        color:rgba(255,255,255,0.9);
        border-color:rgba(255,255,255,0.25);
      }
      @media(max-width:600px){
        .toast{
          bottom:20px;
          padding:14px 10px 14px 18px;
          border-radius:16px;
          font-size:14px;
        }
        .toast__close{width:44px;height:44px;border-radius:12px}
      }
    `;
    document.head.appendChild(s);
  }

  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  const t = document.createElement("div");
  t.className = "toast toast--" + (type || "info");
  t.innerHTML = `
    <span class="toast__icon">${icon}</span>
    <span class="toast__msg">${msg}</span>
    <button class="toast__close" aria-label="Close">✕</button>
  `;

  const dismiss = () => {
    t.style.animation = "toastOut .3s ease forwards";
    setTimeout(() => t.remove(), 320);
  };

  t.querySelector(".toast__close").addEventListener("click", dismiss);
  document.body.appendChild(t);

  const timer = setTimeout(dismiss, 3000);
  t.querySelector(".toast__close").addEventListener("click", () =>
    clearTimeout(timer),
  );
}

(function () {
  "use strict";

  // ─────────────────────────────────────────
  // Hover Effects
  // ─────────────────────────────────────────
  const hoverMap = {
    project: "hover-lift-project",
    button: "hover-lift-small",
    "contact-item": "hover-lift-contact",
  };

  document
    .querySelectorAll(".project, .contact-item, .button")
    .forEach((el) => {
      const hoverClass = Object.keys(hoverMap).find((key) =>
        el.classList.contains(key),
      );
      if (hoverClass) {
        el.addEventListener("mouseenter", () =>
          el.classList.add(hoverMap[hoverClass]),
        );
        el.addEventListener("mouseleave", () =>
          el.classList.remove(hoverMap[hoverClass]),
        );
      }
    });

  // ─────────────────────────────────────────
  // Tab Navigation
  // ─────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".tab-button");
    let isScrolling = false;

    const sections = Array.from(buttons)
      .map((btn) => {
        const t = btn.getAttribute("data-target");
        return (
          document.querySelector("." + t) || document.querySelector("#" + t)
        );
      })
      .filter(Boolean);

    const setActiveTab = (targetClass) => {
      buttons.forEach((btn) => {
        btn.classList.toggle(
          "tab-button-active",
          btn.getAttribute("data-target") === targetClass,
        );
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const t = button.getAttribute("data-target");
        const el =
          document.querySelector("." + t) || document.querySelector("#" + t);
        if (el) {
          isScrolling = true;
          setActiveTab(t);
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => (isScrolling = false), 1000);
        }
      });
    });

    const ratioMap = new Map();

    const updateActiveTab = () => {
      let maxRatio = 0,
        bestSection = null;
      sections.forEach((sec) => {
        const ratio = ratioMap.get(sec) || 0;
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestSection = sec;
        }
      });
      if (bestSection) {
        const matching = Array.from(buttons).find((btn) => {
          const t = btn.getAttribute("data-target");
          return bestSection.classList.contains(t) || bestSection.id === t;
        });
        if (matching) setActiveTab(matching.getAttribute("data-target"));
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling) return;
        entries.forEach((e) => ratioMap.set(e.target, e.intersectionRatio));
        updateActiveTab();
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
      },
    );

    sections.forEach((sec) => {
      ratioMap.set(sec, 0);
      observer.observe(sec);
    });

    const scrollPos = window.scrollY + window.innerHeight / 3;
    sections.forEach((sec) => {
      const top = sec.offsetTop,
        bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos <= bottom) {
        const matching = Array.from(buttons).find((btn) => {
          const t = btn.getAttribute("data-target");
          return sec.classList.contains(t) || sec.id === t;
        });
        if (matching) setActiveTab(matching.getAttribute("data-target"));
      }
    });
  });

  // ─────────────────────────────────────────
  // Functional Popovers
  // ─────────────────────────────────────────
  const isMobile = () => window.innerWidth <= 768;
  const funcWrappers = document.querySelectorAll(".func-wrapper");

  const clearHighlight = () => {
    document.querySelectorAll("mark.search-highlight").forEach((mark) => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  };

  funcWrappers.forEach((wrapper) => {
    const input = wrapper.querySelector("#search-input");
    const btn = wrapper.querySelector(".func-button");
    const popover = wrapper.querySelector(
      ".popover, .search-popover, .info-popover",
    );

    wrapper.addEventListener("mouseenter", () => {
      if (input && !isMobile()) setTimeout(() => input.focus(), 300);
    });
    wrapper.addEventListener("mouseleave", () => {
      if (input && !isMobile()) input.blur();
    });

    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wasActive = wrapper.classList.contains("active");
        if (!wasActive) {
          funcWrappers.forEach((w) => w.classList.remove("active"));
          wrapper.classList.add("active");
          if (input) setTimeout(() => input.focus(), 100);
        } else {
          wrapper.classList.remove("active");
          if (input) {
            clearHighlight();
            input.value = "";
          }
        }
      });
    }

    if (popover) popover.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", () => {
    const sw = document.querySelector(".func-wrapper.left");
    const si = document.getElementById("search-input");
    if (sw && sw.classList.contains("active")) {
      sw.classList.remove("active");
      if (si) {
        clearHighlight();
        si.value = "";
      }
    }
    funcWrappers.forEach((w) => w.classList.remove("active"));
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) funcWrappers.forEach((w) => w.classList.remove("active"));
  });

  // ─────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightSearch = (term) => {
    clearHighlight();
    if (!term.trim()) return;
    const regex = new RegExp(`(${escapeRegExp(term.trim())})`, "gi");
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          ["SCRIPT", "STYLE", "HEADER", "BUTTON", "INPUT"].includes(
            node.parentNode.tagName,
          )
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      },
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      if (regex.test(textNode.nodeValue)) {
        const tmp = document.createElement("div");
        tmp.innerHTML = textNode.nodeValue.replace(
          regex,
          '<mark class="search-highlight">$1</mark>',
        );
        while (tmp.firstChild)
          textNode.parentNode.insertBefore(tmp.firstChild, textNode);
        textNode.parentNode.removeChild(textNode);
      }
    });
  };

  const searchInput = document.getElementById("search-input");
  if (searchInput)
    searchInput.addEventListener("input", (e) =>
      highlightSearch(e.target.value),
    );

  // ─────────────────────────────────────────
  // Site Loader
  // ─────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("site-loader");
    if (!loader) return;
    document.body.style.overflow = "hidden";
    const MIN_SHOW = 3000;
    const start = Date.now();
    window.addEventListener("load", () => {
      const elapsed = Date.now() - start;
      setTimeout(
        () => {
          loader.classList.add("reverse");
          setTimeout(() => {
            loader.classList.add("hidden");
            document.body.style.overflow = "";
            if (loader.parentNode) loader.parentNode.removeChild(loader);
          }, 200);
        },
        Math.max(0, MIN_SHOW - elapsed),
      );
    });
  });
})();

// ─────────────────────────────────────────
// Lightbox (single instance, shared)
// ─────────────────────────────────────────
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openLightbox(src) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add("active");
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("active");
}

if (lightbox) {
  document
    .querySelector(".lightbox-overlay")
    ?.addEventListener("click", closeLightbox);
  document
    .querySelector(".lightbox-close")
    ?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  document.querySelectorAll(".photo-item img").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img.src));
  });

  // Stats image click (2024.png)
  document.querySelectorAll(".stat[data-img]").forEach((stat) => {
    stat.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(stat.dataset.img);
    });
  });
}

// ─────────────────────────────────────────
// Comments Module
// ─────────────────────────────────────────
(function () {
  "use strict";

  const TOKEN_KEY = "portfolio_delete_tokens_v1";

  const nameEl = document.getElementById("c-name");
  const emailEl = document.getElementById("c-email");
  const textEl = document.getElementById("c-text");
  const submitEl = document.getElementById("commentSubmit");
  const listEl = document.getElementById("commentList");
  const errorEl = document.getElementById("commentError");
  const bannerEl = document.getElementById("commentRateBanner");
  const rateText = document.getElementById("commentRateText");
  const charCount = document.getElementById("charCount");
  const photoEl = document.getElementById("c-photo");
  const photoNameEl = document.getElementById("c-photo-name");
  const photoDrop = document.getElementById("c-photo-drop");

  if (!nameEl) return;

  // ── Token helpers ──
  function loadTokens() {
    try {
      return JSON.parse(localStorage.getItem(TOKEN_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveToken(id, token) {
    const t = loadTokens();
    t[String(id)] = token;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  }
  function getToken(id) {
    return loadTokens()[String(id)] || null;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }
  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join("");
  }
  function escHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function formatTime(iso) {
    return new Date(iso).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function updateBanner(blocked) {
    bannerEl.classList.remove("warn", "blocked");
    if (blocked) {
      bannerEl.classList.add("blocked");
      rateText.textContent =
        "You have reached the 3-comment monthly limit. Try again next month.";
      submitEl.disabled = true;
    } else {
      rateText.textContent = "You can post up to 3 comments per month.";
      submitEl.disabled = false;
    }
  }

  // ── Photo preview ──
  let _photoPreviewEl = null;

  function showPhotoPreview(dataUrl, fileName) {
    if (_photoPreviewEl) {
      _photoPreviewEl.remove();
      _photoPreviewEl = null;
    }
    const img = document.createElement("img");
    img.className = "c-photo-preview-upload";
    img.src = dataUrl;
    img.alt = fileName;
    img.style.cssText = [
      "display:block",
      "width:100%",
      "max-height:200px",
      "object-fit:cover",
      "border-radius:10px",
      "margin-top:10px",
      "border:1px solid rgba(255,255,255,0.12)",
      "cursor:pointer",
      "animation:cFadeIn .3s ease both",
    ].join(";");
    img.addEventListener("click", () => openLightbox(dataUrl));
    photoDrop.appendChild(img);
    _photoPreviewEl = img;
  }

  function clearPhotoPreview() {
    if (_photoPreviewEl) {
      _photoPreviewEl.remove();
      _photoPreviewEl = null;
    }
    if (photoNameEl) photoNameEl.textContent = "";
  }

  function handlePhotoFile(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Only PNG and JPG images are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    if (photoNameEl) photoNameEl.textContent = file.name;
    if (photoEl) {
      const dt = new DataTransfer();
      dt.items.add(file);
      photoEl.files = dt.files;
    }
    const reader = new FileReader();
    reader.onload = (e) => showPhotoPreview(e.target.result, file.name);
    reader.readAsDataURL(file);
  }

  if (photoEl)
    photoEl.addEventListener("change", () => handlePhotoFile(photoEl.files[0]));

  if (photoDrop) {
    photoDrop.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("c-photo-click") ||
        e.target === photoDrop ||
        e.target.closest(".c-photo-inner")
      )
        photoEl.click();
    });
    photoDrop.addEventListener("dragover", (e) => {
      e.preventDefault();
      photoDrop.classList.add("drag-over");
    });
    photoDrop.addEventListener("dragleave", () =>
      photoDrop.classList.remove("drag-over"),
    );
    photoDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      photoDrop.classList.remove("drag-over");
      handlePhotoFile(e.dataTransfer.files[0]);
    });
  }

  // ── Email validation ──
  let _emailValid = null;
  let _emailChecked = "";

  function setEmailState(valid, msg) {
    _emailValid = valid;
    const label = emailEl.closest(".c-label");
    label.classList.toggle("invalid", valid === false);
    label.classList.toggle("valid", valid === true);
    let hint = label.parentNode.querySelector(".c-email-hint");
    if (hint) hint.remove();
    if (msg) {
      hint = document.createElement("div");
      hint.className = "c-email-hint";
      hint.textContent = msg;
      hint.style.cssText = [
        `color:${valid ? "rgba(76,175,125,0.9)" : "rgba(255,130,130,0.9)"}`,
        "font-size:11px",
        "margin-top:4px",
        "padding-left:2px",
        "animation:cFadeIn .2s ease both",
      ].join(";");
      label.parentNode.insertBefore(hint, label.nextSibling);
    }
  }

  async function checkEmailDomain() {
    const email = emailEl.value.trim();
    if (!email || email === _emailChecked) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailState(false, "Invalid email format.");
      return;
    }
    _emailChecked = email;
    setEmailState(null, "Checking email…");
    try {
      const res = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setEmailState(
        data.valid,
        data.valid ? "✓ Email looks good." : data.reason,
      );
    } catch {
      setEmailState(null, "");
    }
  }

  emailEl.addEventListener("blur", checkEmailDomain);

  // ── Render comment card ──
  function renderCard(comment, prepend) {
    const card = document.createElement("div");
    card.className = "c-card";
    card.dataset.id = comment.id;

    const token = getToken(comment.id);
    const deleteHtml = token
      ? `<button class="c-delete-btn" data-id="${comment.id}" title="Delete your comment" style="
          flex-shrink:0;
          width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          border-radius:8px;
          border:1px solid rgba(220,60,60,0.35);
          background:rgba(200,50,50,0.18);
          color:rgba(255,110,110,0.9);
          font-size:13px;
          cursor:pointer;
          transition:background .2s,border-color .2s,transform .2s;
          padding:0;
        "
        onmouseover="this.style.background='rgba(200,50,50,0.38)';this.style.borderColor='rgba(220,60,60,0.6)';this.style.transform='scale(1.08)'"
        onmouseout="this.style.background='rgba(200,50,50,0.18)';this.style.borderColor='rgba(220,60,60,0.35)';this.style.transform='scale(1)'"
      ><i class="fa-solid fa-trash"></i></button>`
      : "";

    card.innerHTML = `
      <div class="c-card-header">
        <div class="c-avatar">${escHtml(getInitials(comment.name))}</div>
        <div class="c-meta">
          <div class="c-name">${escHtml(comment.name)}</div>
          <div class="c-email">${escHtml(comment.email)}</div>
        </div>
        <div class="c-time">${formatTime(comment.created_at)}</div>
        ${deleteHtml}
      </div>
      <div class="c-body">${escHtml(comment.text)}</div>
      ${comment.photo ? `<img class="c-photo-preview" src="${comment.photo}" alt="comment photo">` : ""}
    `;

    const delBtn = card.querySelector(".c-delete-btn");
    if (delBtn) {
      delBtn.addEventListener("click", async () => {
        delBtn.classList.add("deleting");
        try {
          const res = await fetch(
            `/api/comments/${comment.id}?token=${encodeURIComponent(token)}`,
            { method: "DELETE" },
          );
          if (res.ok) {
            card.style.transition = "opacity .3s, transform .3s";
            card.style.opacity = "0";
            card.style.transform = "translateX(20px)";
            setTimeout(() => {
              card.remove();
              if (!listEl.querySelector(".c-card")) showEmpty();
            }, 300);
            showToast("Comment deleted.", "success");
          } else {
            showToast("Could not delete comment.", "error");
            delBtn.classList.remove("deleting");
          }
        } catch {
          showToast("Network error. Please try again.", "error");
          delBtn.classList.remove("deleting");
        }
      });
    }

    if (comment.photo) {
      const img = card.querySelector(".c-photo-preview");
      if (img) {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => openLightbox(img.src));
      }
    }

    const empty = listEl.querySelector(".comment-empty");
    if (empty) empty.remove();

    if (prepend) listEl.prepend(card);
    else listEl.appendChild(card);
  }

  function showEmpty() {
    if (!listEl.querySelector(".c-card")) {
      const p = document.createElement("p");
      p.className = "comment-empty";
      p.textContent = "No comments yet. Be the first!";
      listEl.appendChild(p);
    }
  }

  function setError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.toggle("visible", !!msg);
  }

  function shake(labelEl) {
    labelEl.classList.add("invalid");
    setTimeout(() => labelEl.classList.remove("invalid"), 1200);
  }

  textEl.addEventListener("input", () => {
    const len = textEl.value.length;
    charCount.textContent = `${len} / 1000`;
    charCount.style.color = len > 900 ? "rgba(255,130,130,0.7)" : "";
  });

  submitEl.addEventListener("click", async () => {
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const text = textEl.value.trim();
    setError("");

    let valid = true;
    if (!name) {
      shake(nameEl.closest(".c-label"));
      valid = false;
    }
    if (!validateEmail(email)) {
      shake(emailEl.closest(".c-label"));
      valid = false;
    } else if (_emailValid === false) {
      shake(emailEl.closest(".c-label"));
      valid = false;
    }
    if (!text) {
      textEl.style.borderColor = "rgba(255,80,80,0.5)";
      setTimeout(() => {
        textEl.style.borderColor = "";
      }, 1200);
      valid = false;
    }
    if (!valid) {
      setError(
        "Please fill in all fields correctly (valid name, email, and comment).",
      );
      return;
    }

    submitEl.disabled = true;

    const finalize = async (photoData) => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, text, photo: photoData || null }),
        });

        const data = await res.json();

        if (res.status === 429) {
          updateBanner(true);
          setError(data.error || "Monthly comment limit reached.");
          submitEl.disabled = false;
          return;
        }
        if (!res.ok) {
          setError(data.error || "Failed to submit comment. Please try again.");
          submitEl.disabled = false;
          return;
        }

        saveToken(data.id, data.delete_token);
        renderCard(data, true);

        nameEl.value = "";
        emailEl.value = "";
        textEl.value = "";
        charCount.textContent = "0 / 1000";
        if (photoEl) photoEl.value = "";
        if (photoNameEl) photoNameEl.textContent = "";
        clearPhotoPreview();
        setError("");
        updateBanner(false);
        submitEl.disabled = false;
        showToast("Comment published!", "success");
      } catch {
        setError("Network error. Please check your connection.");
        submitEl.disabled = false;
      }
    };

    const file = photoEl && photoEl.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => finalize(e.target.result);
      reader.readAsDataURL(file);
    } else {
      finalize(null);
    }
  });

  // ─────────────────────────────────────────
  // Scroll Reveal
  // ─────────────────────────────────────────
  (function () {
    const style = document.createElement("style");
    style.textContent = `
      .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1),
                    transform 0.6s cubic-bezier(0.4,0,0.2,1);
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else {
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    function observe() {
      document
        .querySelectorAll(
          ".project, .photo-item, .c-card, .contact-item, " +
            ".section-title, .paragraph, .support-buttons, .view-all-wrapper, " +
            ".comment-form-card, .comment-list",
        )
        .forEach((el, i) => {
          el.classList.add("reveal");
          el.style.transitionDelay = `${(i % 6) * 0.07}s`;
          observer.observe(el);
        });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", observe);
    } else {
      observe();
    }
  })();

  // ── Init: load comments from API ──
  async function init() {
    updateBanner(false);
    try {
      const res = await fetch("/api/comments");
      if (!res.ok) throw new Error("fetch failed");
      const comments = await res.json();
      if (comments.length === 0) {
        showEmpty();
      } else {
        comments.forEach((c) => renderCard(c, false));
      }
    } catch {
      listEl.innerHTML =
        '<p class="comment-empty">Could not load comments. Make sure the Flask server is running.</p>';
    }
  }

  init();
})();
