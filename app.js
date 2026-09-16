/* ============================================================
   Search + nation chips + restriction-card touch toggle.
   ============================================================ */

(function () {
  const searchInput = document.getElementById("search");
  const searchClear = document.getElementById("search-clear");
  const searchStatus = document.getElementById("search-status");
  const emptyState = document.getElementById("empty-state");
  const hero = document.getElementById("hero");
  const nations = [...document.querySelectorAll(".nation-page")];
  const chips = [...document.querySelectorAll(".nation-chip")];
  const isRestrictions = document.body.getAttribute("data-page") === "restrictions";

  function applySearch(raw) {
    const q = raw.trim().toLowerCase();
    let visibleCount = 0;

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

        if (isRestrictions) {
          clan.querySelectorAll(".restriction-cell").forEach((cell) => {
            const name = (cell.getAttribute("data-name") || "").toLowerCase();
            const status = (cell.querySelector(".status-copy")?.textContent || "").toLowerCase();
            const show = !q || clanMatches || name.includes(q) || status.includes(q);
            cell.classList.toggle("is-hidden", !show);
            if (show) {
              clanHasVisible = true;
              visibleCount += 1;
            }
          });
        } else {
          clan.querySelectorAll(".deck-tile").forEach((tile) => {
            const name = (tile.getAttribute("data-name") || "").toLowerCase();
            const show = !q || clanMatches || name.includes(q);
            tile.classList.toggle("is-hidden", !show);
            if (show) {
              clanHasVisible = true;
              visibleCount += 1;
            }
          });
        }

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
        const unit = isRestrictions
          ? visibleCount === 1 ? "card" : "cards"
          : visibleCount === 1 ? "deck" : "decks";
        searchStatus.textContent =
          "Showing " + visibleCount + " " + unit + " matching \u201c" + raw.trim() + "\u201d.";
        searchStatus.classList.add("visible");
      } else {
        searchStatus.classList.remove("visible");
        searchStatus.textContent = "";
      }
    }

    if (emptyState) {
      emptyState.classList.toggle("visible", filtering && visibleCount === 0);
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

  function setActiveChip(target) {
    chips.forEach((c) => {
      const on = c === target;
      c.setAttribute("data-active", on ? "true" : "false");
      if (!on && document.activeElement === c) c.blur();
    });
  }

  function chipForHash(hash) {
    if (!hash || hash === "#" || hash === "#top" || hash === "#catalog") return null;
    return chips.find((c) => c.getAttribute("href") === hash) || null;
  }

  chips.forEach((chip) => {
    chip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      setActiveChip(chip);
    });
    chip.addEventListener("click", () => setActiveChip(chip));
  });

  window.addEventListener("hashchange", () => {
    setActiveChip(chipForHash(location.hash));
  });
  setActiveChip(chipForHash(location.hash));

  /* Restriction tiles: click pins enlarge + status; click outside closes */
  const restrictCells = [...document.querySelectorAll(".restriction-cell")];

  /* Prefer status panel on the right; flip left if it would leave the viewport */
  function updateStatusSide(cell) {
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const roomRight = window.innerWidth - rect.left;
    const scale = parseFloat(getComputedStyle(cell).getPropertyValue("--restrict-scale")) || 2.15;
    // Scaled card width + ~15rem panel
    const need = rect.width * scale + 15 * 16;
    cell.classList.toggle("status-left", roomRight < need && rect.left > need * 0.45);
  }

  function closeAllRestrict(except) {
    restrictCells.forEach((cell) => {
      if (cell === except) return;
      cell.classList.remove("is-open");
      const t = cell.querySelector(".restrict-tile");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  restrictCells.forEach((cell) => {
    const tile = cell.querySelector(".restrict-tile");
    if (!tile) return;

    cell.addEventListener("pointerenter", () => updateStatusSide(cell));

    tile.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !cell.classList.contains("is-open");
      closeAllRestrict(willOpen ? cell : null);
      if (willOpen) updateStatusSide(cell);
      cell.classList.toggle("is-open", willOpen);
      tile.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest(".restriction-cell")) return;
    closeAllRestrict(null);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllRestrict(null);
  });

  document.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("mouseup", () => {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const node =
      sel.anchorNode &&
      (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
    if (
      node &&
      (node.closest(".clan-head") ||
        node.closest(".nation-heading") ||
        node.closest(".deck-tile") ||
        node.closest(".restrict-tile") ||
        node.closest(".nation-chip") ||
        node.closest(".nation-page"))
    ) {
      sel.removeAllRanges();
    }
  });
})();
