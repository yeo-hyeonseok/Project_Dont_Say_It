/* 토스트 메시지 */
function printToastMsg(msg) {
  const toastMsg = document.querySelector("p#toast_msg");

  toastMsg.innerText = msg;
  toastMsg.className = "active";

  setTimeout(() => {
    toastMsg.classList.remove("active");
  }, 2000);
}
