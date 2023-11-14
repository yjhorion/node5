import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타잎이 일치하지 않습니다");

    const decodedToken = jwt.verify(token, "secretKey");
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      res.clearCookie("authorization");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    /* 사용자의 type 이 CUSTOMER/OWNER 인지 인증할때 사용할 UserInfos.userType */
    // const userType = await prisma.userInfos.findFirst({
    //     where: {userId: userId},
    // }).userType

    req.user = user;

    next();
  } catch (error) {
    res.clearCookie("authorization");
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다" });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰 인증에 실패하였습니다" });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "비 정상적인 요청입니다" });
    }
  }
}
