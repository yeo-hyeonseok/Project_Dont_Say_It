/* ---------- socket ---------- */
const socket = io();

socket.on("connect", () => {
  console.log("소켓 연결됨:", socket.id);
});

/* ---------- room ---------- */
/* 나가기 버튼 */
const exitButton = document.querySelector("span.exit_button");

exitButton.addEventListener("click", () => history.back());

/* 타이머 */
const timer = document.querySelector("span.timer");

let time = 120;
let timeInterval;

function startTimer() {
  timeInterval = setInterval(() => {
    if (time > 0) {
      time--;

      const minutes = Math.floor(time / 60);
      const seconds = time % 60;

      timer.innerText = `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
    } else {
      clearInterval(timeInterval);
    }
  }, 1000);
}

startTimer();

/* 시간 조정 */
const remainChances = document.querySelector("span.remain_chances");
const extendButton = document.querySelector("span.extend_button");
const shortenButton = document.querySelector("span.shorten_button");

let chanceCount = 3;

extendButton.addEventListener("click", () => {
  if (chanceCount > 0) {
    if (time <= 100) {
      time += 20;
      chanceCount--;
      remainChances.innerText = chanceCount;
    }
  } else {
    printToastMsg("더 이상 시간 변경이 불가능합니다.");
  }
});

shortenButton.addEventListener("click", () => {
  if (chanceCount > 0) {
    if (time >= 20) {
      time -= 20;
      chanceCount--;
      remainChances.innerText = chanceCount;
    }
  } else {
    printToastMsg("더 이상 시간 변경이 불가능합니다.");
  }
});
