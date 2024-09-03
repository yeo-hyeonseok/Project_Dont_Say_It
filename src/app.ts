import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import { Server, Socket } from "socket.io";
import mainRouter from "./routes/main";
import roomRouter from "./routes/room";

const app = express();

/* Configuration */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Router */
app.use("/", mainRouter);
app.use("/room", roomRouter);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket: Socket) => {
  console.log("소켓 연결됨");
});

httpServer.listen(3000, () => console.log("3000번 포트 연결 중..."));
