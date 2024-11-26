/*
  [소켓 이벤트 흐름 플로우 차트]
  https://miro.com/welcomeonboard/b0hBVHJWUjU5UXA4WGJSNzNwQkQ2cFg0aEVqQU9kZVVuNkRPQkFrN2lsUllXcHRYZDZVTUkyMHRBNHJJMjZmcnwzNDU4NzY0NjA1NTA1ODA4MDM4fDI=?share_link_id=839278419630
*/

import http from "http";
import shortid from "shortid";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { getRandomWord } from "./data/words";
import { getRandomTopic } from "./data/topics";

function setWebSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true,
    },
  });

  instrument(io, {
    auth: false,
  });

  function getRandomIndex(length: number) {
    return Math.floor(Math.random() * length);
  }

  function getPublicRooms() {
    const sids = io.sockets.adapter.sids;
    const rooms = io.sockets.adapter.rooms;

    return Array.from(rooms).filter((room) => !sids.get(room[0]));
  }

  io.on("connection", (socket: Socket) => {
    console.log("소켓 연결됨:", socket.id);

    let roomName: string;
    let time = 180;
    let timeInterval: NodeJS.Timeout | undefined;
    let forbiddenWord: string;

    socket.on("enter_room", () => {
      const filtered = Array.from(getPublicRooms()).filter(
        (room) => room[1].size < 2
      );

      if (filtered.length > 0) {
        // 빈 방 있으면 참여
        roomName = filtered[getRandomIndex(filtered.length)][0];

        socket.join(roomName);
        io.to(roomName).emit("send_welcome", roomName, getRandomTopic());
      } else {
        // 빈 방 없으면 방 생성
        roomName = shortid.generate();

        socket.join(roomName);
      }
    });

    socket.on("send_forbiddenWord", () => {
      forbiddenWord = getRandomWord();

      socket.to(roomName).emit("send_forbiddenWord", forbiddenWord);
    });

    socket.on("init_timer", () => {
      time = 180;
    });

    socket.on("start_timer", () => {
      timeInterval = setInterval(() => {
        if (time > 0) {
          time--;

          socket.emit("time_change", time);
        } else {
          clearInterval(timeInterval);

          socket.emit("time_over");
        }
      }, 1000);
    });

    socket.on("adjust_time", (amount: number, done: () => void) => {
      if (time === 180) return;

      if (amount > 0 ? time <= 160 : time >= 20) {
        time += amount;

        io.to(roomName).emit("adjust_time", time);
        io.to(roomName).emit(
          "send_notice",
          socket.id,
          amount > 0 ? "시간을 연장했습니다." : "시간을 단축했습니다."
        );
        done();
      }
    });

    socket.on("sync_time", (currentTime) => {
      time = currentTime;
    });

    socket.on("send_message", (msg: string, done: () => void) => {
      if (time === 180) return;

      if (msg.includes(forbiddenWord)) {
        io.to(roomName).emit(
          "send_forbiddenMessage",
          socket.id,
          msg,
          forbiddenWord
        );
        socket.emit("user_lost", forbiddenWord);
        socket.to(roomName).emit("user_won_process");
      } else {
        socket.to(roomName).emit("send_message", msg);

        done();
      }
    });

    socket.on("user_won_process", () => {
      socket.emit("user_won", forbiddenWord);
    });

    socket.on("game_over", () => {
      socket.leave(roomName);

      clearInterval(timeInterval);
      time = 180;
      roomName = "";
    });

    socket.on("disconnect", () => {
      socket.to(roomName).emit("send_notice", socket.id, "퇴장했습니다.");
      socket.to(roomName).emit("opponent_left");
    });
  });
}

export default setWebSocket;
