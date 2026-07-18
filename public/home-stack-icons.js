(() => {
  const SPRITE_PATH = "/icons/home-stack/home-stack-sprite.txt";
  const ICON_SIZE = 48;
  const ICON_COUNT = 7;

  const waitForGrid = () =>
    new Promise((resolve) => {
      const findGrid = () => {
        const icons = document.querySelectorAll("#icon-grid .icon-art");
        if (icons.length >= 8) {
          resolve(Array.from(icons));
          return true;
        }
        return false;
      };

      if (findGrid()) return;

      const observer = new MutationObserver(() => {
        if (findGrid()) observer.disconnect();
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });

  const loadSprite = async () => {
    const response = await fetch(SPRITE_PATH, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load icon sprite: ${response.status}`);
    }

    const base64 = (await response.text()).trim();
    const source = `data:image/png;base64,${base64}`;

    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error("The custom icon sprite is invalid."));
      image.src = source;
    });

    return source;
  };

  const installIcons = (icons, spriteSource) => {
    for (let index = 0; index < ICON_COUNT; index += 1) {
      const slot = icons[index + 1];
      const image = document.createElement("img");

      image.src = spriteSource;
      image.alt = "";
      image.draggable = false;
      image.width = ICON_SIZE * ICON_COUNT;
      image.height = ICON_SIZE;
      image.style.position = "absolute";
      image.style.left = `${-index * ICON_SIZE}px`;
      image.style.top = "0";
      image.style.width = `${ICON_SIZE * ICON_COUNT}px`;
      image.style.height = `${ICON_SIZE}px`;
      image.style.maxWidth = "none";

      slot.replaceChildren(image);
      slot.style.position = "relative";
      slot.style.overflow = "hidden";
      slot.style.visibility = "visible";
    }
  };

  Promise.all([waitForGrid(), loadSprite()])
    .then(([icons, spriteSource]) => installIcons(icons, spriteSource))
    .catch((error) => {
      console.error("Failed to load custom home stack icons", error);
    });
})();
