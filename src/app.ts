import express from "express";
import path from "path";
import mainRouter from "./routes/main";

const app = express();

/* Configuration */
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

/* Router */
app.use("/", mainRouter);

app.listen(3000, () => console.log("3000번 포트 연결 중..."));
