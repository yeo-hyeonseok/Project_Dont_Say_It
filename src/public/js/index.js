/* 다크모드 사전 설정 */
if (localStorage.getItem("theme") === "dark")
  document.documentElement.setAttribute("data-theme", "dark");

/* 토스트 메시지 */
function printToastMsg(msg) {
  const toastMsg = document.querySelector("p#toast_msg");

  toastMsg.innerText = msg;
  toastMsg.className = "active";

  setTimeout(() => {
    toastMsg.classList.remove("active");
  }, 2000);
}
