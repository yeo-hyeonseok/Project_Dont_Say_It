import express from "express";

const router = express.Router();

router.get("/", (_, res) => {
  res.render("room");
});

router.post("/save_socketId", (req, res) => {
  const socketId = req.cookies?.socketId;

  if (!socketId) {
    res.cookie("socketId", req.body.socketId, {
      secure: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: 86400000,
    });

    return res.json({ message: "소켓 아이디 쿠키 저장함", socketId });
  }

  res.json({ message: "소켓 아이디 이미 저장되어있음", socketId });
});

router.get("/check_socketId", (req, res) => {
  const socketId = req.cookies?.socketId;

  socketId
    ? res.json({ message: "[check_socketId] 소켓 아이디 있음", isExist: true })
    : res.json({
        message: "[check_socketId] 소켓 아이디 없음",
        isExist: false,
      });
});

router.post("/delete_socketId", async (_, res) => {
  res.clearCookie("socketId");

  res.json({ message: "쿠키 삭제됨" });
});

export default router;
