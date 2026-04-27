document.addEventListener("DOMContentLoaded", () => {
    const parentSiteUrl = "https://iusspavia-carisma.github.io/";
    const relabel = [
        ["mdbook-theme-light", "Light"],
        ["mdbook-theme-rust", "Rust"],
        ["mdbook-theme-ayu", "Forest"],
        ["mdbook-theme-navy", "Night"],
    ];

    for (const [id, label] of relabel) {
        const button = document.getElementById(id);
        if (button) {
            button.textContent = label;
        }
    }

    for (const id of ["mdbook-theme-default_theme", "mdbook-theme-coal"]) {
        const button = document.getElementById(id);
        if (button && button.parentElement) {
            button.parentElement.style.display = "none";
        }
    }

    const menuBar = document.getElementById("menu-bar");
    if (menuBar && !document.querySelector(".parent-site-link")) {
        const link = document.createElement("a");
        link.href = parentSiteUrl;
        link.className = "parent-site-link";
        link.textContent = "Parent Site";
        link.setAttribute("aria-label", "Go to parent site");
        menuBar.appendChild(link);
    }
});
