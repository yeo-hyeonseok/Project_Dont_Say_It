import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import { Server, Socket } from "socket.io";
import cookieParser from "cookie-parser";
import mainRouter from "./routes/main";
import roomRouter from "./routes/room";
import topics from "./data/topics";
import forbiddenWords from "./data/forbiddenWords";

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

wsServer.on("connection", (socket: Socket) => {
  console.log("소켓 연결됨:", socket.id);

  socket.on("disconnect", () => {
    console.log("소켓 연결 해제됨");
  });
});

httpServer.listen(3000, () => console.log("3000번 포트 연결 중..."));
