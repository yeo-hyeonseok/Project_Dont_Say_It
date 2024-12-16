/* 다크 모드 */
const darkModeToggle = document.querySelector("input#toggle");

if (localStorage.getItem("theme") === "dark") {
  darkModeToggle.checked = true;
  toggleThemeIcon();
}

darkModeToggle.addEventListener("change", () => {
  toggleThemeIcon();

  if (darkModeToggle.checked) {
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
});

function toggleThemeIcon() {
  const darkModeButton = document.querySelector("div.darkmode_button");
  const icons = darkModeButton.querySelectorAll("i");

  icons.forEach((item) => item.classList.toggle("inactive"));
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
