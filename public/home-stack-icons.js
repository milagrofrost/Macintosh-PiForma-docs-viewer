(() => {
  const SPRITE_PATH = "/icons/home-stack/home-stack-sprite.txt";
  const ICON_SIZE = 48;
  const ICON_COUNT = 7;
  const INSTALLED_MARKER = "customHomeStackIcon";
  const PHOTO_TOUR_LABEL = "Photo Tour";
  const PHOTO_TOUR_BUTTON_ID = "photo-tour";

  const findPhotoTourStackButton = () =>
    Array.from(document.querySelectorAll("#icon-grid .icon-button")).find(
      (button) => button.querySelector(".icon-label")?.textContent?.trim() === PHOTO_TOUR_LABEL,
    );

  const installPhotoTourToolbarButton = () => {
    const toolbar = document.querySelector(".toolbar");
    const updateButton = document.getElementById("update");
    if (!toolbar || !updateButton) return false;

    let button = document.getElementById(PHOTO_TOUR_BUTTON_ID);
    if (!button) {
      button = document.createElement("button");
      button.id = PHOTO_TOUR_BUTTON_ID;
      button.textContent = PHOTO_TOUR_LABEL;
      button.addEventListener("click", () => {
        const stackButton = findPhotoTourStackButton();
        if (stackButton instanceof HTMLButtonElement) stackButton.click();
      });
      toolbar.insertBefore(button, updateButton);
    }

    return true;
  };

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

  const installIcons = (spriteSource) => {
    installPhotoTourToolbarButton();

    const photoTourButton = findPhotoTourStackButton();
    if (photoTourButton instanceof HTMLElement) photoTourButton.style.display = "none";

    const homeButtons = Array.from(document.querySelectorAll("#icon-grid .icon-button")).filter(
      (button) => button !== photoTourButton,
    );
    const icons = homeButtons
      .map((button) => button.querySelector(".icon-art"))
      .filter((icon) => icon instanceof HTMLElement);

    if (icons.length < 8) return false;

    for (let index = 0; index < ICON_COUNT; index += 1) {
      const slot = icons[index + 1];

      if (slot.dataset[INSTALLED_MARKER] === "true") {
        slot.style.visibility = "visible";
        continue;
      }

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
      image.style.pointerEvents = "none";

      slot.replaceChildren(image);
      slot.style.position = "relative";
      slot.style.overflow = "hidden";
      slot.style.visibility = "visible";
      slot.dataset[INSTALLED_MARKER] = "true";
    }

    return true;
  };

  loadSprite()
    .then((spriteSource) => {
      let scheduled = false;

      const scheduleInstall = () => {
        if (scheduled) return;
        scheduled = true;

        requestAnimationFrame(() => {
          scheduled = false;
          installIcons(spriteSource);
        });
      };

      scheduleInstall();

      // Reload and documentation updates rebuild the home icon grid. Keep the
      // observer active so the toolbar button and custom icons are restored.
      const observer = new MutationObserver(scheduleInstall);
      observer.observe(document.getElementById("app") || document.body, {
        childList: true,
        subtree: true,
      });
    })
    .catch((error) => {
      console.error("Failed to load custom home stack icons", error);
    });
})();
