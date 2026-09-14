/* ============================================================
   Search + nation chip highlight only.
   Deck tiles are normal links: <a class="deck-tile" href="...">
   ============================================================ */

(function () {
  const searchInput = document.getElementById("search");
  const searchClear = document.getElementById("search-clear");
  const searchStatus = document.getElementById("search-status");
  const emptyState = document.getElementById("empty-state");
  const hero = document.getElementById("hero");
  const nations = [...document.querySelectorAll(".nation-page")];
  const chips = [...document.querySelectorAll(".nation-chip")];

  /* ---------- Search ---------- */

  function applySearch(raw) {
    const q = raw.trim().toLowerCase();
    let visibleDecks = 0;

    nations.forEach((nation) => {
      let nationHasVisible = false;
      const clans = nation.querySelectorAll(".clan");

      clans.forEach((clan) => {
        const clanText = (
          (clan.querySelector("h3")?.textContent || "") +
          " " +
          (clan.querySelector(".clan-head p")?.textContent || "") +
          " " +
          (nation.querySelector("h2")?.textContent || "")
        ).toLowerCase();

        const clanMatches = !q || clanText.includes(q);
        let clanHasVisible = false;

        clan.querySelectorAll(".deck-tile").forEach((tile) => {
          const name = (tile.getAttribute("data-name") || "").toLowerCase();
          const show = !q || clanMatches || name.includes(q);
          tile.classList.toggle("is-hidden", !show);
          if (show) {
            clanHasVisible = true;
            visibleDecks += 1;
          }
        });

        clan.classList.toggle("is-hidden", !clanHasVisible);
        if (clanHasVisible) nationHasVisible = true;
      });

      nation.classList.toggle("is-hidden", !nationHasVisible);
    });

    const filtering = q.length > 0;
    if (hero) hero.style.display = filtering ? "none" : "";
    if (searchClear) searchClear.classList.toggle("visible", filtering);

    if (searchStatus) {
      if (filtering) {
        searchStatus.textContent =
          "Showing " +
          visibleDecks +
          " " +
          (visibleDecks === 1 ? "deck" : "decks") +
          " matching \u201c" +
          raw.trim() +
          "\u201d.";
        searchStatus.classList.add("visible");
      } else {
        searchStatus.classList.remove("visible");
        searchStatus.textContent = "";
      }
    }

    if (emptyState) {
      emptyState.classList.toggle("visible", filtering && visibleDecks === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => applySearch(searchInput.value));
  }

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      applySearch("");
      searchInput.focus();
    });
  }

  const resetBtn = document.getElementById("reset-search");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      applySearch("");
    });
  }

  /* ---------- Nation chips (exactly one active; survives fast clicks) ---------- */

  function setActiveChip(target) {
    chips.forEach((c) => {
      const on = c === target;
      c.setAttribute("data-active", on ? "true" : "false");
      // Drop focus from chips that are no longer active so :focus-visible
      // glow cannot leave two chips looking selected after rapid clicks.
      if (!on && document.activeElement === c) {
        c.blur();
      }
    });
  }

  function chipForHash(hash) {
    if (!hash || hash === "#" || hash === "#top" || hash === "#catalog") {
      return null;
    }
    return chips.find((c) => c.getAttribute("href") === hash) || null;
  }

  chips.forEach((chip) => {
    // pointerdown updates the highlight immediately (before focus settles),
    // so a second fast click cannot leave the previous chip still glowing.
    chip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      setActiveChip(chip);
    });

    chip.addEventListener("click", () => {
      setActiveChip(chip);
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveChip(chipForHash(location.hash));
  });

  // Initial state from URL, if any
  setActiveChip(chipForHash(location.hash));

  /* ---------- Stop image-drag / text-select from locking the UI ---------- */

  document.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") {
      e.preventDefault();
    }
  });

  // After a drag-select over emblems/tiles, clear the selection so the page
  // does not stay in a half-selected state that blocks further clicks.
  document.addEventListener("mouseup", () => {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const node = sel.anchorNode && (sel.anchorNode.nodeType === 1
      ? sel.anchorNode
      : sel.anchorNode.parentElement);
    if (
      node &&
      (node.closest(".clan-head") ||
        node.closest(".nation-heading") ||
        node.closest(".deck-tile") ||
        node.closest(".nation-chip") ||
        node.closest(".nation-page"))
    ) {
      sel.removeAllRanges();
    }
  });
})();
