/* ---------- socket ---------- */
let socket;

function setFormattedTimer(time) {
  const timer = document.querySelector("span.timer");

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  timer.textContent = `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
}

function setSocketListeners() {
  if (!socket) return;

  socket.emit("user_match");

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

  socket.on("time_change", (time) => {
    setFormattedTimer(time);
  });

  socket.on("send_welcome", (roomName, topic) => {
    const loadingMsg = document.querySelector("p.loading_msg");
    loadingMsg.style.display = "none";

    sendNotice(`[${roomName}] 상대방이 입장했습니다.`);

    setTimeout(() => {
      sendNotice(
        "⚠️ 상대방에게 불쾌감을 줄 수 있는 비속어나 욕설은 삼가주세요."
      );
    }, 1500);

    setTimeout(() => {
      sendNotice(`대화 주제: ${topic}`);
    }, 4500);

    setTimeout(() => {
      sendNotice("상대방과 대화를 시작해보세요.");

      socket.emit("start_timer");
    }, 6000);
  });

  socket.on("send_notice", (socketId, notice) => {
    const subject = socket.id === socketId ? "" : "상대방이 ";

    sendNotice(`${subject + notice}`);
    chatScrollToBottom();
  });

  socket.on("send_myword", (myWord) => {
    setTimeout(() => {
      sendForbiddenWord(myWord);
    }, 3000);
  });

  socket.on("send_otherword", (otherWord) => {
    setTimeout(() => {
      sendForbiddenWord(otherWord);
    }, 3000);
  });

  socket.on("adjust_time", (time) => {
    setFormattedTimer(time);

    socket.emit("sync_time", time);
  });

  socket.on("send_message", (msg) => {
    const chatList = document.querySelector("div.chat_list");
    const message = document.createElement("div");
    const span = document.createElement("span");
    const p = document.createElement("p");

    message.classList.add("other_msg");
    span.textContent = "상대";
    p.textContent = msg;

    message.append(span);
    message.append(p);
    chatList.append(message);

    chatScrollToBottom();
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

/* 채팅창 */
function sendNotice(msg) {
  const chatList = document.querySelector("div.chat_list");
  const notice = document.createElement("p");

  notice.classList.add("notice");
  notice.textContent = msg;

  chatList.append(notice);
}

function sendForbiddenWord(word) {
  const wordContainer = document.querySelector("div.word_container");
  const forbiddenWord = document.querySelector("span.forbidden_word");
  const chatList = document.querySelector("div.chat_list");
  const notice = document.createElement("p");
  const span = document.createElement("span");

  notice.classList.add("notice");
  notice.textContent = "상대방의 금칙어는 ";
  span.textContent = word;
  notice.append(span);
  notice.append(document.createTextNode("입니다."));
  forbiddenWord.textContent = word;
  wordContainer.style.visibility = "visible";

  chatList.append(notice);
}

function chatScrollToBottom() {
  const chatList = document.querySelector("div.chat_list");
  const scrollHeight = chatList.scrollHeight;

  chatList.scrollTo(0, scrollHeight);
}

/* 시간 조정 */
const extendButton = document.querySelector("span.extend_button");
const shortenButton = document.querySelector("span.shorten_button");

let chanceCount = 3;

function adjustTime(amount) {
  if (chanceCount > 0) {
    socket.emit("adjust_time", amount, () => {
      const remainChances = document.querySelector("span.remain_chances");

      chanceCount--;
      remainChances.textContent = chanceCount;
    });
  } else {
    printToastMsg("더 이상 시간 변경이 불가능합니다.");
  }
}

extendButton.addEventListener("click", () => {
  adjustTime(20);
});

shortenButton.addEventListener("click", () => {
  adjustTime(-20);
});

/* 메시지 입력창 */
const messageForm = document.querySelector("form.message_form");

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const input = messageForm.querySelector("input");

  socket.emit("send_message", input.value, () => {
    const chatList = document.querySelector("div.chat_list");
    const message = document.createElement("div");
    const p = document.createElement("p");

    message.classList.add("my_msg");
    p.textContent = input.value;

    message.append(p);
    chatList.append(message);

    input.value = "";
    input.focus();

    chatScrollToBottom();
  });
});
