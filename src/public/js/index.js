/* ---------- 공통 ---------- */
/* 토스트 메시지 */
const toastMsg = document.querySelector("p#toast_msg");

function printToastMsg(msg) {
  toastMsg.innerText = msg;
  toastMsg.className = "active";

  setTimeout(() => {
    toastMsg.classList.remove("active");
  }, 2000);
}
