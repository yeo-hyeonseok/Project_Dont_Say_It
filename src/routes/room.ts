import express from "express";

const router = express.Router();

router.get("/", (_, res) => {
  res.render("room");
});

router.post("/save_socketId", (req, res) => {
  const socketId = req.cookies?.socketId;

  if (!socketId) {
    res.cookie("socketId", req.body.socketId, {
      httpOnly: true,
      secure: true,
      maxAge: 86400000,
    });
  }

  res.json({ message: "쿠키에 소켓 아이디 저장됨", socketId });
});

router.post("/delete_socketId", async (_, res) => {
  res.clearCookie("socketId");

  res.json({ message: "쿠키 삭제됨" });
});

export default router;
