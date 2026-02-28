// nav.js — Recovery Misfits v2 shared bottom nav (single source of truth)
(() => {
  const mount = document.getElementById("rm-bottom-nav");
  if (!mount) return;

  // --- Config: edit ONLY this list when you want to change the nav ---
  const items = [
    { href: "./index2.html",  icon: "🏠", label: "Home" },
    { href: "./tools.html",   icon: "🔧", label: "Tools" },
    { href: "./readings.html",icon: "📖", label: "Readings" },
    { href: "./audio.html",   icon: "🎧", label: "Audio" },
    { href: "./fun.html",     icon: "🎮", label: "Fun" },
    { href: "./updates.html", icon: "🆕", label: "Updates" }
  ];

  // --- Styles injected once (so you don't need to duplicate CSS in every page) ---
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
        font-size:18px;
        margin-bottom:3px;
      }
      .navItem.active{
        color:#fff;
        font-weight:700;
      }
    `;
    document.head.appendChild(style);
  }

  function currentFile() {
    // Works on GitHub Pages + local
    const path = window.location.pathname;
    const last = path.split("/").pop() || "";
    return last.toLowerCase();
  }

  const cur = currentFile();

  const nav = document.createElement("nav");
  nav.id = "bottomBar";

  items.forEach((it) => {
    const a = document.createElement("a");
    a.className = "navItem";
    a.href = it.href;

    // Determine active: compare filename portion
    const target = (it.href.split("/").pop() || "").toLowerCase();
    if (target && cur === target) a.classList.add("active");

    a.innerHTML = `<span class="ico">${it.icon}</span>${it.label}`;
    nav.appendChild(a);
  });

  mount.replaceChildren(nav);
})();
