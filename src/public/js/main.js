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
