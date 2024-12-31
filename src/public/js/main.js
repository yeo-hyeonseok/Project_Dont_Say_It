/* 다크 모드 설정 */
const darkModeToggle = document.querySelector("input#toggle");

darkModeToggle.addEventListener("change", () => {
  applyDarkMode(darkModeToggle.checked);
  toggleThemeIcon(darkModeToggle.checked);
});

initializeTheme();

function initializeTheme() {
  const userTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  const themeToApply = userTheme || systemTheme;

  if (themeToApply === "dark") {
    darkModeToggle.checked = true;
    applyDarkMode(true);
  } else {
    darkModeToggle.checked = false;
    applyDarkMode(false);
  }

  toggleThemeIcon(darkModeToggle.checked);
}

function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", "#2b2b2b");

    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", "#fcfcfc");

    localStorage.setItem("theme", "light");
  }
}

function toggleThemeIcon(isDark) {
  const darkModeButton = document.querySelector("div.darkmode_button");
  const icons = darkModeButton.querySelectorAll("i");

  if (isDark) {
    icons[0].classList.add("inactive");
    icons[1].classList.remove("inactive");
  } else {
    icons[0].classList.remove("inactive");
    icons[1].classList.add("inactive");
  }
}

/* 게임 방법 모달창 */
const tipButton = document.querySelector("span.main_tip");

tipButton.addEventListener("click", () => showTipModal());

function showTipModal() {
  const tipModal = document.querySelector("dialog.tip_modal");
  const exitButton = tipModal.querySelector("button.modal_exitBtn");

  tipModal.addEventListener("click", function (e) {
    const rect = tipModal.getBoundingClientRect();

    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      tipModal.close();
    }
  });

  exitButton.addEventListener("click", () => tipModal.close());

  tipModal.showModal();
}
