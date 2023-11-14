import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { createCategories } from "../middlewares/error.handler/joi.error.definition.js";

const router = express.Router();

/* 카테고리 등록 */
router.post("/categories", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { name } = await createCategories.validateAsync(req.body);

    const isOwner = await prisma.userInfos.findFirst({
      where: { UserId: userId },
    });

    if (isOwner.userType !== "OWNER") {
      return res
        .status(401)
        .json({ message: "카테고리 등록은 사장님만 가능합니다" });
    }

    let order = 1;

    const currentCategory = await prisma.categories.findFirst({
      orderBy: { order: "desc" },
    });

    if (currentCategory) {
      order = currentCategory.order + 1;
    }

    const author = (
      await prisma.users.findFirst({
        where: { userId: userId },
      })
    ).nickname;

    const category = await prisma.categories.create({
      data: {
        UserId: userId,
        name,
        order,
        author,
      },
    });
    return res.status(201).json({ data: category });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 카테고리 목록 조회 */
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.categories.findMany({
      where: { deletedAt: null },
      select: {
        categoryId: true,
        name: true,
        order: true,
        author: true,
      },
      orderBy: {
        order: "asc",
      },
    });
    return res.status(200).json({ data: categories });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 카테고리 수정 */
router.post(
  "/categories/:categoryId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { categoryId } = req.params;
      const { name, order } = await createCategories.validateAsync(req.body);

      const isOwner = await prisma.userInfos.findFirst({
        where: { UserId: userId },
      });

      if (isOwner.userType !== "OWNER") {
        return res
          .status(401)
          .json({ message: "카테고리 수정은 사장님만 가능합니다" });
      }

      const category = await prisma.categories.findFirst({
        where: { categoryId: +categoryId, deletedAt: null },
      });

      if (!category) {
        return res
          .status(404)
          .json({ message: "조회하신 카테고리가 존재하지 않습니다" });
      }

      if (category.UserId !== userId) {
        return res.status(401).json({ message: "수정 권한이 없습니다" });
      }

      const currentCategory = await prisma.categories.findFirst({
        where: { order },
      });

      if (currentCategory) {
        await prisma.categories.updateMany({
          where: { OR: [{ order: { gt: order } }, { order: order }] },
          data: { order: { increment: 1 } },
        });
      }

      await prisma.categories.update({
        where: { categoryId: +categoryId },
        data: { name, order },
      });

      return res
        .status(201)
        .json({ message: "카테고리 수정이 완료되었습니다" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

/* 카테고리 삭제 */
router.patch(
  "/categories/:categoryId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { userId } = req.user;

      const category = await prisma.categories.findFirst({
        where: { categoryId: +categoryId },
      });

      if (!category) {
        return res
          .status(404)
          .json({ message: "카테고리가 존재하지 않습니다" });
      }

      if (category.UserId !== userId) {
        return res.status(401).json({ message: "삭제 권한이 없습니다" });
      }

      await prisma.categories.update({
        where: { categoryId: +categoryId },
        data: {
          deletedAt: new Date(),
          Menus: {
            updateMany: {
              where: { CategoryId: +categoryId },
              data: { deletedAt: new Date() },
            },
          },
        },
      });
      return res.status(200).json({ message: "카테고리를 삭제하였습니다" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);
export default router;
