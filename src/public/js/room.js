/* ---------- socket ---------- */
let socket;

function setSocketListeners() {
  if (!socket) return;

  socket.emit("user_match", () => {});

  socket.on("connect", () => {
    const socketId = socket.id;

    console.log("[connect] 연결된 소켓:", socketId);

    fetch("/room/save_socketId", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ socketId }),
    })
      .then((res) => res.json())
      .then((data) => console.log(data.message))
      .catch((e) => console.error(e));
  });

  socket.on("send_notice", (roomName, forbiddenWord, topic) => {
    const loadingMsg = document.querySelector("p.loading_msg");
    loadingMsg.style.display = "none";

    sendNotice(`[${roomName}] 상대방이 입장했습니다.`);

    setTimeout(() => {
      sendNotice(
        "⚠️ 상대방에게 불쾌감을 줄 수 있는 비속어나 욕설은 삼가주세요."
      );
    }, 1500);

    setTimeout(() => {
      sendForbiddenWord(forbiddenWord);
    }, 3000);

    setTimeout(() => {
      sendNotice(`대화 주제: ${topic}`);
    }, 4500);

    setTimeout(() => {
      sendNotice("상대방과 대화를 시작해보세요.");
    }, 6000);
  });
}

function connectSocket() {
  fetch("/room/check_socketId", {
    method: "GET",
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data.message);

      if (data.isExist) {
        console.log("<<<<중복 접속 하심>>>>");
      } else {
        console.log("<<<<중복 접속 아니심>>>>");

        socket = io();
        setSocketListeners();
      }
    })
    .catch((e) => console.error(e));
}

// >> 시작 지점 <<
connectSocket();

/* ---------- room ---------- */
/* 나가기 버튼 */
const exitButton = document.querySelector("span.exit_button");

exitButton.addEventListener("click", () => {
  fetch("/room/delete_socketId", {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => console.log(data.message))
    .catch((e) => console.error(e));

  history.back();
});

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

      timer.textContent = `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
    } else {
      clearInterval(timeInterval);
    }
  }, 1000);
}

/* 채팅창 */
function sendNotice(msg) {
  const chatList = document.querySelector("div.chat_list");
  const notice = document.createElement("p");

  notice.classList.add("notice");
  notice.textContent = msg;

  chatList.append(notice);
}

function sendForbiddenWord(word) {
  const chatList = document.querySelector("div.chat_list");
  const forbiddenWord = document.querySelector("span.forbidden_word");
  const notice = document.createElement("p");
  const span = document.createElement("span");

  notice.classList.add("notice");
  notice.textContent = "상대방의 금칙어는 ";
  span.textContent = word;
  notice.append(span);
  notice.append(document.createTextNode("입니다."));
  forbiddenWord.textContent = word;
  forbiddenWord.style.visibility = "visible";

  chatList.append(notice);
}

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
      remainChances.textContent = chanceCount;
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
      remainChances.textContent = chanceCount;
    }
  } else {
    printToastMsg("더 이상 시간 변경이 불가능합니다.");
  }
});
