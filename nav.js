// nav.js — Recovery Misfits v2 shared bottom nav with inline SVG icons
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  /* =========================
     SVG ICONS (inline, no files needed)
     ========================= */
  const ICONS = {
    home: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 10.5V21h11V10.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    tools: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M14 7a5 5 0 0 0-6.5 6.5L3 18l3 3 4.5-4.5A5 5 0 0 0 17 10l-3 3-2-2 2-4z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    book: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M5 19h11" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
      </svg>
    `,
    audio: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M4 12V9a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
        <path d="M4 12a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M20 12a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
      </svg>
    `,
    fun: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2l-2 2H10l-2-2H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M9 13h2M10 12v2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>
        <circle cx="16" cy="14" r="1" fill="currentColor"/>
      </svg>
    `,
    updates: `
      <svg viewBox="0 0 24 24" class="rm-ico" aria-hidden="true">
        <path d="M12 2l2.2 6.6H21l-5.4 3.9L17.8 19 12 14.9 6.2 19l2.2-6.5L3 8.6h6.8L12 2z"
          fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
      </svg>
    `
  };

  /* =========================
     NAV ITEMS (edit here only)
     ========================= */
  const items = [
    { href: "./index2.html",  icon: ICONS.home,    label: "Home" },
    { href: "./tools.html",   icon: ICONS.tools,   label: "Tools" },
    { href: "./readings.html",icon: ICONS.book,    label: "Readings" },
    { href: "./audio.html",   icon: ICONS.audio,   label: "Audio" },
    { href: "./fun.html",     icon: ICONS.fun,     label: "Fun" },
    { href: "./updates.html", icon: ICONS.updates, label: "Updates" }
  ];

  /* =========================
     Inject shared styles once
     ========================= */
  const styleId = "rm-bottom-nav-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      nav#bottomBar{
        position:fixed;
        bottom:0;
        left:0;
        right:0;
        height:64px;
        background:#000;
        border-top:1px solid #222;
        display:flex;
        justify-content:space-around;
        align-items:center;
        z-index:9500;
      }
      .navItem{
        flex:1;
        text-align:center;
        text-decoration:none;
        font-size:11px;
        padding:8px 4px;
        color:#bbb;
      }
      .navItem .ico{
        display:block;
        margin:0 auto 3px;
      }
      .navItem.active{
        color:#fff;
        font-weight:700;
      }
      .rm-ico{
        width:20px;
        height:20px;
        display:block;
      }
    `;
    document.head.appendChild(style);
  }

  /* =========================
     Determine active page
     ========================= */
  function currentFile() {
    const path = window.location.pathname;
    return (path.split("/").pop() || "").toLowerCase();
  }

  const cur = currentFile();

  /* =========================
     Build nav
     ========================= */
  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  items.forEach((it) => {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    const target = (it.href.split("/").pop() || "").toLowerCase();
    if (target && cur === target) a.classList.add("active");

    a.innerHTML = `<span class="ico">${it.icon}</span>${it.label}`;
    nav.appendChild(a);
  });

  mount.replaceChildren(nav);
})();
