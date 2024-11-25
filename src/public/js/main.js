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
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  }
});

function toggleThemeIcon() {
  const darkModeButton = document.querySelector("div.darkmode_button");
  const icons = darkModeButton.querySelectorAll("i");

  icons.forEach((item) => item.classList.toggle("inactive"));
}
