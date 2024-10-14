import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import cookieParser from "cookie-parser";
import mainRouter from "./routes/main";
import roomRouter from "./routes/room";
import setWebSocket from "./socket";

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

setWebSocket(httpServer);

httpServer.listen(3000, () => console.log("3000번 포트 연결 중..."));
