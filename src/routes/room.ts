import express from "express";

const router = express.Router();

router.get("/", (_, res) => {
  res.render("room");
});

export default router;
