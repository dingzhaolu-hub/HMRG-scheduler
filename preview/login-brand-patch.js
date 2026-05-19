(function () {
  const logoPath = "/brand-logo-mark.png?v=hmrg-logo-2026";

  const patchLoginBrand = () => {
    document.querySelectorAll(".login-brand-logo, .logo-mark").forEach((image) => {
      image.src = logoPath;
    });

    const brandText = document.querySelector(".login-brand-text");
    if (!brandText || brandText.dataset.loginBrandPatched === "true") return;
    brandText.dataset.loginBrandPatched = "true";
    brandText.innerHTML = `
      <span>Hamilton Medical Research Group</span>
      <strong>Clinical Research Scheduler</strong>
    `;
  };

  const observer = new MutationObserver(patchLoginBrand);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  patchLoginBrand();
})();
