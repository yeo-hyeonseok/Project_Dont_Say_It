import express from "express";
import path from "path";
import compression from "compression";
import helmet from "helmet";
import mainRouter from "./routes/main";

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

app.listen(3000, () => console.log("3000번 포트 연결 중..."));
