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

  socket.on("user_match", (done: () => void) => {
    const filtered = Array.from(getPublicRooms()).filter(
      (room) => room[1].size < 2
    );

    if (filtered.length > 0) {
      // 빈 방 있으면 참여
      const randomRoom = filtered[getRandomIndex(filtered.length)][0];

      socket.join(randomRoom);
      wsServer.to(randomRoom).emit("send_notice", randomRoom);

      console.log("[user_match] 방에 참여함");
    } else {
      // 빈 방 없으면 방 생성
      const roomName = shortid.generate();

      socket.join(roomName);

      console.log("[user_match] 새로운 방 생성함");
    }
  });

  socket.on("disconnect", () => {
    console.log("소켓 연결 해제됨");
  });

  console.log("publicRooms: ", getPublicRooms());
});

httpServer.listen(3000, () => console.log("3000번 포트 연결 중..."));
