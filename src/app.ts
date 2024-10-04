import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import { Server, Socket } from "socket.io";
import cookieParser from "cookie-parser";
import shortid from "shortid";
import mainRouter from "./routes/main";
import roomRouter from "./routes/room";
import { getRandomWord } from "./data/words";
import { getRandomTopic } from "./data/topics";

const app = express();
const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
const upgradeInsecureRequests = "upgrade-insecure-requests";
const {
  [upgradeInsecureRequests]: removeDirective,
  ...otherDefaultDirectives
} = defaultDirectives;

/* Configuration */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        ...otherDefaultDirectives,
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Router */
app.use("/", mainRouter);
app.use("/room", roomRouter);

/* Socket */
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

function getRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function getPublicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  return Array.from(rooms).filter((room) => !sids.get(room[0]));
}

wsServer.on("connection", (socket: Socket) => {
  console.log("소켓 연결됨:", socket.id);

  let roomName: string;
  let time = 120;
  let timeInterval: NodeJS.Timeout | undefined;
  const myWord: string = getRandomWord();
  const otherWord: string = getRandomWord();

  socket.on("user_match", () => {
    const filtered = Array.from(getPublicRooms()).filter(
      (room) => room[1].size < 2
    );

    if (filtered.length > 0) {
      // 빈 방 있으면 참여
      roomName = filtered[getRandomIndex(filtered.length)][0];

      socket.join(roomName);
      socket.emit("time_change", time);
      wsServer.to(roomName).emit("send_welcome", roomName, getRandomTopic());
      socket.emit("send_myword", myWord);
      socket.to(roomName).emit("send_otherword", otherWord);
    } else {
      // 빈 방 없으면 방 생성
      roomName = shortid.generate();

      socket.join(roomName);
      socket.emit("time_change", time);
    }
  });

  socket.on("start_timer", () => {
    timeInterval = setInterval(() => {
      if (time > 0) {
        time--;

        socket.emit("time_change", time);
      } else {
        clearInterval(timeInterval);
      }
    }, 1000);
  });

  socket.on("adjust_time", (amount: number, done: () => void) => {
    const condition = amount > 0 ? time <= 100 : time >= 20;

    if (condition) {
      time += amount;

      wsServer.to(roomName).emit("adjust_time", time);
      wsServer
        .to(roomName)
        .emit(
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

  socket.on("disconnect", () => {
    console.log("소켓 연결 해제됨");
  });
});

httpServer.listen(3000, () => console.log("3000번 포트 연결 중..."));
