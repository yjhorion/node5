import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validAccountInfo } from "../middlewares/error.handler/joi.error.definition.js";

const router = express.Router();

/* 회원가입 */
router.post("/sign-up", async (req, res, next) => {
  try {
    const { nickname, password, userType } =
      await validAccountInfo.validateAsync(req.body);

    const isExistUser = await prisma.users.findFirst({
      where: { nickname },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 존재하는 닉네임 입니다" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        nickname,
        password: hashedPassword,
      },
    });

    const userInfo = await prisma.userInfos.create({
      data: {
        UserId: user.userId,
        userType,
      },
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 로그인 API */
router.post("/sign-in", async (req, res, next) => {
  try {
    const { nickname, password } = await validAccountInfo.validateAsync(
      req.body,
    );
    const user = await prisma.users.findFirst({ where: { nickname } });

    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 닉네임입니다" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다" });
    }

    const userInfo = await prisma.userInfos.findFirst({
      where: { UserId: user.userId },
    });

    const token = jwt.sign(
      {
        userId: user.userId,
      },
      "secretKey",
    );

    let userType = "";

    if (userInfo.userType === "CUSTOMER") {
      userType = "고객님";
    } else if (userInfo.userType === "OWNER") {
      userType = "사장님";
    }

    res.cookie("authorization", `Bearer ${token}`);
    return res
      .status(200)
      .json({ message: `${nickname} ${userType} 로그인에 성공하셨습니다` });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 내 정보 조회 */
router.get("/myInfo", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,

        UserInfos: {
          select: {
            userType: true,
          },
        },
      },
    });
    return res.status(200).json({ data: user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 회원 탈퇴 */
router.delete("/sign-off", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "이미 삭제처리 되었거나 존재하지 않는 회원입니다" });
    }

    await prisma.users.delete({
      where: { userId: +userId },
    });

    return res
      .status(200)
      .json({ message: `${user.nickname}님의 계정이 탈퇴처리 되었습니다` });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
