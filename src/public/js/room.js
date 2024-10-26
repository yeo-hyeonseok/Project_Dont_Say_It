/* ---------- common ---------- */
function exitRoom() {
  fetch("/room/delete_socketId", {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => console.log(data.message))
    .catch((e) => console.error(e));

  location.replace("/");
}

function setFormattedTimer(time) {
  const timer = document.querySelector("span.timer");

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  timer.textContent = `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
}

/* ---------- socket ---------- */
let socket;
let isMatched = false;

function setSocketListeners() {
  if (!socket) return;

  socket.emit("enter_room");

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
    isMatched = true;

    sendNotice(`[${roomName}] 상대방이 입장했습니다.`);

    socket.emit("send_forbiddenWord");

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

  socket.on("send_forbiddenWord", (forbiddenWord) => {
    setTimeout(() => {
      sendForbiddenWord(forbiddenWord);
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

  socket.on("user_lost", (forbiddenWord) => {
    showResultModal("🥲 패배", `당신의 금칙어는 '${forbiddenWord}'이었습니다.`);
  });

  socket.on("user_won_process", () => {
    socket.emit("user_won_process");
  });

  socket.on("user_won", (forbiddenWord) => {
    showResultModal("🥳 승리", `당신의 금칙어는 '${forbiddenWord}'이었습니다.`);
  });

  socket.on("time_over", () => {
    isMatched = false;
    showResultModal(
      "😐 무승부",
      "제한 시간이 모두 지나 게임이 종료되었습니다."
    );

    socket.emit("time_over");
    socket.emit("init_timer");
  });

  socket.on("opponent_left", () => {
    isMatched = false;
    showResultModal("승리", "상대방이 퇴장했습니다.");

    socket.emit("exit_room");
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
        const loadingMsg = document.querySelector("p.loading_msg");
        const br = document.createElement("br");

        loadingMsg.textContent = "현재 참여 중인 방이 있습니다.";
        loadingMsg.append(br);
        loadingMsg.append(
          document.createTextNode("게임을 진행하시려면 현재 방을 나가주세요.")
        );
      } else {
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
  isMatched ? showExitModal() : exitRoom();
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

/* 시간 변경 버튼 */
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
  if (isMatched) adjustTime(20);
});

shortenButton.addEventListener("click", () => {
  if (isMatched) adjustTime(-20);
});

/* 메시지 입력창 */
const messageForm = document.querySelector("form.message_form");

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const input = messageForm.querySelector("input");

  if (isMatched && input.value.trim() !== "") {
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
  }
});

/* 모달창 */
function showExitModal() {
  const exitModal = document.querySelector("dialog.exit_modal");
  const modalCloseButton = exitModal.querySelector("button.modal_closeBtn");
  const modalExitButton = exitModal.querySelector("button.modal_exitBtn");

  exitModal.addEventListener("click", function (e) {
    const rect = exitModal.getBoundingClientRect();

    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      exitModal.close();
    }
  });

  modalCloseButton.addEventListener("click", () => {
    exitModal.close();
  });

  modalExitButton.addEventListener("click", () => {
    socket.emit("exit_room");

    exitRoom();
  });

  exitModal.showModal();
}

function showResultModal(title, desc) {
  const resultModal = document.querySelector("dialog.result_modal");
  const h2 = resultModal.querySelector("h2");
  const p = resultModal.querySelector("p");
  const exitButton = resultModal.querySelector("button.modal_exitBtn");
  const matchButton = resultModal.querySelector("button.modal_matchBtn");

  h2.textContent = title;
  p.textContent = desc;

  resultModal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
    }
  });

  resultModal.addEventListener("cancel", (e) => e.preventDefault());

  exitButton.addEventListener("click", () => {
    exitRoom();
  });

  matchButton.addEventListener("click", () => {
    // 채팅 기록 삭제 후, 로딩 메시지 띄우기
    const chatList = document.querySelector("div.chat_list");
    const p = document.createElement("p");

    chatList.innerHTML = "";
    p.textContent = "상대방을 기다리는 중입니다...";
    p.classList.add("loading_msg");
    chatList.append(p);

    // 변경 기회 초기화
    const remainChances = document.querySelector("span.remain_chances");

    chanceCount = 3;
    remainChances.textContent = chanceCount;

    // 타이머 초기화
    setFormattedTimer(120);

    socket.emit("init_timer");

    // 상대방 금칙어 숨기기
    const wordContainer = document.querySelector("div.word_container");

    wordContainer.style.visibility = "hidden";

    resultModal.close();
    socket.emit("enter_room");
  });

  resultModal.showModal();
}
