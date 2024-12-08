/* ---------- common ---------- */
function exitRoom() {
  deleteSocketId()
    .then((result) => console.log(result.message))
    .catch((error) => console.error(error));

  location.replace("/");
}

function setFormattedTimer(time) {
  const timer = document.querySelector("span.timer");

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  timer.textContent = `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
}

function initRoomInfo() {
  // 상대방 금칙어 숨기기
  const wordContainer = document.querySelector("div.word_container");

  wordContainer.style.visibility = "hidden";

  // 타이머 초기화
  setFormattedTimer(180);

  socket.emit("init_timer");

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

  // 입력창 초기화
  const messageForm = document.querySelector("form.message_form");
  const input = messageForm.querySelector("input");

  input.value = "";
}

/* ---------- socket ---------- */
let socket;
let isMatched = false;
let timeoutIds = [];

function setSocketListeners() {
  if (!socket) return;

  socket.emit("enter_room");

  socket.on("connect", () => {
    const socketId = socket.id;

    console.log("[connect] 연결된 소켓:", socketId);

    saveSocketId(socketId)
      .then((result) => console.log(result.message))
      .catch((error) => console.error(error));
  });

  socket.on("time_change", (time) => {
    setFormattedTimer(time);
  });

  socket.on("send_welcome", (roomName, topic) => {
    const loadingMsg = document.querySelector("p.loading_msg");

    loadingMsg.style.display = "none";
    isMatched = true;

    timeoutIds.forEach((item) => clearTimeout(item));
    timeoutIds = [];

    timeoutIds.push(
      setTimeout(() => {
        if (!isMatched) return;

        sendNotice(`[${roomName}] 상대방이 입장했습니다.`);
      }, 0)
    );

    timeoutIds.push(
      setTimeout(() => {
        if (!isMatched) return;

        sendNotice(
          "⚠️ 상대방에게 불쾌감을 줄 수 있는 비속어나 욕설은 삼가주세요."
        );
      }, 1500)
    );

    timeoutIds.push(
      setTimeout(() => {
        if (!isMatched) return;

        socket.emit("send_forbiddenWord");
      }, 3000)
    );

    timeoutIds.push(
      setTimeout(() => {
        if (!isMatched) return;

        sendNotice(`대화 주제: ${topic}`);
      }, 4500)
    );

    timeoutIds.push(
      setTimeout(() => {
        if (!isMatched) return;

        sendNotice("상대방과 대화를 시작해보세요.");

        socket.emit("start_timer");
      }, 6000)
    );
  });

  socket.on("send_notice", (socketId, notice) => {
    const subject = socket.id === socketId ? "" : "상대방이 ";

    sendNotice(`${subject + notice}`);
    chatScrollToBottom();
  });

  socket.on("send_forbiddenWord", (forbiddenWord) => {
    sendForbiddenWord(forbiddenWord);
  });

  socket.on("adjust_time", (time) => {
    setFormattedTimer(time);

    socket.emit("sync_time", time);
  });

  socket.on("send_message", (msg) => {
    if (
      chatList.scrollTop + chatList.clientHeight >=
      chatList.scrollHeight - 20
    ) {
      sendOtherMessage(msg);
      chatScrollToBottom();
    } else {
      sendOtherMessage(msg);
      showMessagePreview(msg);
    }
  });

  socket.on("send_forbiddenMessage", (socketId, msg, forbiddenWord) => {
    socketId === socket.id
      ? sendMyForbiddenMessage(msg, forbiddenWord)
      : sendForbiddenMessage(msg, forbiddenWord);
    chatScrollToBottom();
  });

  socket.on("user_lost", (forbiddenWord) => {
    isMatched = false;
    socket.emit("game_over");

    setTimeout(() => showWinLossModal("🥲 패배", forbiddenWord), 1500);
  });

  socket.on("user_won_process", () => {
    socket.emit("user_won_process");
  });

  socket.on("user_won", (forbiddenWord) => {
    isMatched = false;
    socket.emit("game_over");

    setTimeout(() => showWinLossModal("🥳 승리", forbiddenWord), 1500);
  });

  socket.on("time_over", () => {
    isMatched = false;
    socket.emit("game_over");

    showResultModal(
      "😅 무승부",
      "제한 시간이 모두 지나 게임이 종료되었습니다."
    );
  });

  socket.on("opponent_left", () => {
    isMatched = false;
    socket.emit("game_over");

    setTimeout(
      () => showResultModal("😗 승리", "상대방이 퇴장했습니다."),
      1500
    );
  });

  socket.on("disconnect", () => {
    const modals = document.querySelectorAll("dialog");

    isMatched = false;
    modals.forEach((modal) => modal.close());
    showResultModal("😮 연결 끊김", "상대방과의 연결이 끊어졌습니다.");
  });
}

function connectSocket() {
  checkSocketId()
    .then((result) => {
      console.log(result.message);

      if (result.isExist) {
        notifyDuplicate();
      } else {
        socket = io();
        setSocketListeners();
      }
    })
    .catch((error) => console.error(error));
}

// >>>> 시작 지점 <<<<
connectSocket();

/* ---------- 헤더 ---------- */
const exitButton = document.querySelector("span.exit_button");

exitButton.addEventListener("click", () => {
  isMatched ? showExitModal() : exitRoom();
});

/* ---------- 채팅창 ---------- */
const chatList = document.querySelector("div.chat_list");
const messagePreview = document.querySelector("div.message_preview");
const scrolldownButton = document.querySelector("span.scrolldown_button");

chatList.addEventListener("scroll", () => {
  const guessButton = document.querySelector("span.guess_button");
  const messagePreview = document.querySelector("div.message_preview");

  if (
    chatList.scrollTop + chatList.clientHeight >=
    chatList.scrollHeight - 20
  ) {
    // 채팅창 스크롤 최하단에 있을 때
    scrolldownButton.classList.remove("active");
    messagePreview.classList.remove("active");
    guessButton.classList.add("active");
  } else {
    // 채팅창 스크롤 위에 있을 때
    if (!messagePreview.classList.contains("active")) {
      scrolldownButton.classList.add("active");
      guessButton.classList.remove("active");
    }
  }
});

messagePreview.addEventListener("click", () => {
  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
});

scrolldownButton.addEventListener("click", () => {
  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "smooth",
  });
});

function notifyDuplicate() {
  const loadingMsg = document.querySelector("p.loading_msg");
  const br = document.createElement("br");

  loadingMsg.textContent = "접속 중 문제가 발생했습니다.";
  loadingMsg.append(br);
  loadingMsg.append(document.createTextNode("나가기 버튼을 클릭해주세요."));
}

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

function sendOtherMessage(msg) {
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
}

function sendForbiddenMessage(msg, forbiddenWord) {
  const chatList = document.querySelector("div.chat_list");
  const message = document.createElement("div");
  const label = document.createElement("span");
  const p = document.createElement("p");
  const accent = document.createElement("span");

  const forbiddenIndex = msg.indexOf(forbiddenWord);

  if (forbiddenIndex === -1) {
    p.textContent = msg;
  } else {
    const beforeForbidden = msg.slice(0, forbiddenIndex);
    const afterForbidden = msg.slice(forbiddenIndex + forbiddenWord.length);

    p.textContent = beforeForbidden;
    accent.textContent = forbiddenWord;
    p.append(accent);
    p.append(document.createTextNode(afterForbidden));
  }

  message.classList.add("other_msg");
  label.textContent = "상대";

  message.append(label);
  message.append(p);
  chatList.append(message);
}

function sendMyMessage(msg) {
  const chatList = document.querySelector("div.chat_list");
  const message = document.createElement("div");
  const p = document.createElement("p");

  message.classList.add("my_msg");
  p.textContent = msg;

  message.append(p);
  chatList.append(message);
}

function sendMyForbiddenMessage(msg, forbiddenWord) {
  const chatList = document.querySelector("div.chat_list");
  const message = document.createElement("div");
  const p = document.createElement("p");
  const accent = document.createElement("span");

  const forbiddenIndex = msg.indexOf(forbiddenWord);

  if (forbiddenIndex === -1) {
    p.textContent = msg;
  } else {
    const beforeForbidden = msg.slice(0, forbiddenIndex);
    const afterForbidden = msg.slice(forbiddenIndex + forbiddenWord.length);

    p.textContent = beforeForbidden;
    accent.textContent = forbiddenWord;
    p.append(accent);
    p.append(document.createTextNode(afterForbidden));
  }

  message.classList.add("my_msg");

  message.append(p);
  chatList.append(message);
}

function chatScrollToBottom() {
  const chatList = document.querySelector("div.chat_list");
  const scrollHeight = chatList.scrollHeight;

  chatList.scrollTo(0, scrollHeight);
}

function showMessagePreview(msg) {
  const messagePreview = document.querySelector("div.message_preview");
  const message = messagePreview.querySelector("p");
  const scrolldownButton = document.querySelector("span.scrolldown_button");

  message.textContent = msg;
  messagePreview.classList.add("active");
  scrolldownButton.classList.remove("active");
}

/* ---------- 시간 변경 버튼 ---------- */
const extendButton = document.querySelector("span.extend_button");
const shortenButton = document.querySelector("span.shorten_button");

let chanceCount = 3;

extendButton.addEventListener("click", () => {
  if (isMatched) adjustTime(20);
});

shortenButton.addEventListener("click", () => {
  if (isMatched) adjustTime(-20);
});

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

/* ---------- 메시지 입력창 ---------- */
const messageForm = document.querySelector("form.message_form");

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const input = messageForm.querySelector("input");

  if (isMatched && input.value.trim() !== "") {
    socket.emit("send_message", input.value, () => {
      sendMyMessage(input.value);
      input.value = "";
      input.focus();
      chatScrollToBottom();
    });
  }
});

/* ---------- 모달창 ---------- */
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

  modalCloseButton.addEventListener("click", () => exitModal.close());

  modalExitButton.addEventListener("click", () => exitRoom());

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
    if (event.key === "Escape") event.preventDefault();
  });

  resultModal.addEventListener("cancel", (e) => e.preventDefault());

  exitButton.addEventListener("click", () => exitRoom());

  matchButton.addEventListener(
    "click",
    () => {
      initRoomInfo();
      resultModal.close();

      socket.emit("enter_room");
    },
    { once: true }
  );

  resultModal.showModal();
}

function showWinLossModal(title, forbiddenWord) {
  const winLossModal = document.querySelector("dialog.winLoss_modal");
  const h2 = winLossModal.querySelector("h2");
  const p = winLossModal.querySelector("p");
  const exitButton = winLossModal.querySelector("button.modal_exitBtn");
  const matchButton = winLossModal.querySelector("button.modal_matchBtn");

  h2.textContent = title;
  p.textContent = forbiddenWord;

  winLossModal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") event.preventDefault();
  });

  winLossModal.addEventListener("cancel", (e) => e.preventDefault());

  exitButton.addEventListener("click", () => exitRoom());

  matchButton.addEventListener(
    "click",
    () => {
      initRoomInfo();
      winLossModal.close();

      socket.emit("enter_room");
    },
    { once: true }
  );

  winLossModal.showModal();
}

/* ---------- api 요청 ---------- */
async function deleteSocketId() {
  try {
    const response = await fetch("/room/delete_socketId", {
      method: "POST",
    });

    return response.json();
  } catch (error) {
    console.log(error);
  }
}

async function saveSocketId(socketId) {
  try {
    const response = await fetch("/room/save_socketId", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ socketId }),
    });

    return response.json();
  } catch (error) {
    console.log(error);
  }
}

async function checkSocketId() {
  try {
    const response = await fetch("/room/check_socketId", {
      method: "GET",
    });

    return response.json();
  } catch (error) {
    console.log(error);
  }
}
