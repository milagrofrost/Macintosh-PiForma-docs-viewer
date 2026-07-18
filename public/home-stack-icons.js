(() => {
  const SPRITE_URL = "/icons/home-stack/home-stack-sprite.txt";
  const ICON_SIZE = 48;

  async function installHomeStackIcons() {
    const response = await fetch(SPRITE_URL);
    if (!response.ok) throw new Error(`Unable to load icon sprite: ${response.status}`);

    const base64 = (await response.text()).trim();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const spriteUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));

    const applyIcons = () => {
      const icons = document.querySelectorAll("#icon-grid .icon-art");
      if (icons.length < 8) return false;

      // Leave Meet PiForma, the first stack icon, exactly as it is.
      for (let index = 1; index < 8; index += 1) {
        const icon = icons[index];
        icon.replaceChildren();
        icon.style.backgroundImage = `url(${spriteUrl})`;
        icon.style.backgroundRepeat = "no-repeat";
        icon.style.backgroundPosition = `${-(index - 1) * ICON_SIZE}px 0`;
        icon.style.backgroundSize = `${ICON_SIZE * 7}px ${ICON_SIZE}px`;
      }

      return true;
    };

    if (applyIcons()) return;

    const observer = new MutationObserver(() => {
      if (applyIcons()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  void installHomeStackIcons().catch((error) => {
    console.error("Failed to install custom home stack icons", error);
  });
})();
