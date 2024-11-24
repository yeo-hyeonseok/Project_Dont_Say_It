/* 토스트 메시지 */
function printToastMsg(msg) {
  const toastMsg = document.querySelector("p#toast_msg");

  toastMsg.innerText = msg;
  toastMsg.className = "active";

  setTimeout(() => {
    toastMsg.classList.remove("active");
  }, 2000);
}

/* 다크 모드 버튼 */
const darkModeToggle = document.querySelector("input#toggle");

darkModeToggle.addEventListener("change", () => {
  const darkModeButton = document.querySelector("div.darkmode_button");
  const icons = darkModeButton.querySelectorAll("i");

  icons.forEach((item) => item.classList.toggle("inactive"));
});
