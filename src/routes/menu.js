import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createMenues } from "../middlewares/error.handler/joi.error.definition.js";

const router = express.Router();

/* 메뉴 등록 */
router.post(
  "/categories/:categoryId/menus",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { categoryId } = req.params;
      const { name, description, image, price } =
        await createMenues.validateAsync(req.body);

      const isOwner = await prisma.userInfos.findFirst({
        where: { UserId: userId },
      });

      if (isOwner.userType !== "OWNER") {
        return res
          .status(401)
          .json({ message: "메뉴 등록은 사장님만 가능합니다" });
      }

      const category = await prisma.categories.findFirst({
        where: { categoryId: +categoryId },
      });

      if (!category) {
        return res
          .status(404)
          .json({
            message: "등록되지 않은 카테고리에는 메뉴등록을 할 수 없습니다",
          });
      }

      const author = (
        await prisma.users.findFirst({
          where: { userId: userId },
        })
      ).nickname;

      let order = 1;

      const currentMenu = await prisma.menus.findFirst({
        orderBy: { order: "desc" },
      });

      if (currentMenu) {
        order = currentMenu.order + 1;
      }

      const menu = await prisma.menus.create({
        data: {
          UserId: userId,
          CategoryId: +categoryId,
          name,
          description,
          image,
          price,
          author,
          order,
        },
      });
      return res.status(201).json({ data: menu });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

/* 카테고리별 메뉴 조회 */
router.get("/categories/:categoryId/menus", async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const menus = await prisma.menus.findMany({
      where: { CategoryId: +categoryId, deletedAt: null },
      orderBy: { order: "asc" },
    });
    return res.status(200).json({ data: menus });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 메뉴 상세 조회 */
router.get("/categories/:categoryId/menus/:menuId", async (req, res, next) => {
  try {
    const { categoryId, menuId } = req.params;

    const menu = await prisma.menus.findFirst({
      where: { menuId: +menuId, deletedAt: null },
    });
    return res.status(200).json({ data: menu });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 메뉴 수정 */
router.patch(
  "/categories/:categoryId/menus/:menuId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { categoryId, menuId } = req.params;
      const { name, description, price, order, status } =
        await createMenues.validateAsync(req.body);

      const isOwner = await prisma.userInfos.findFirst({
        where: { UserId: userId },
      });

      if (isOwner.userType !== "OWNER") {
        return res
          .status(401)
          .json({ message: "카테고리 수정은 사장님만 가능합니다" });
      }

      const menu = await prisma.menus.findFirst({
        where: { menuId: +menuId, deletedAt: null },
      });

      if (!menu) {
        return res
          .status(404)
          .json({ message: "조회하신 메뉴가 존재하지 않습니다" });
      }

      if (menu.UserId !== userId) {
        return res.status(401).json({ message: "수정 권한이 없습니다" });
      }

      const currentMenu = await prisma.menus.findFirst({
        where: { order },
      });

      if (currentMenu) {
        await prisma.menus.updateMany({
          where: { OR: [{ order: { gt: order } }, { order: order }] },
          data: { order: { increment: 1 } },
        });
      }

      await prisma.menus.update({
        where: { menuId: +menuId },
        data: { name, description, price, order, status },
      });
      return res.status(201).json({ message: "메뉴 수정이 완료되었습니다" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

/* 메뉴 삭제 */
router.patch(
  "/categories/:categoryId/menus/:menuId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { categoryId, menuId } = req.params;

      const menu = await prisma.menus.findFirst({
        where: { menuId: +menuId },
      });

      if (!menu) {
        return res.status(404).json({ message: "메뉴가 존재하지 않습니다" });
      }

      if (menu.UserId !== userId) {
        return res.status(401).json({ message: "삭제 권한이 없습니다" });
      }

      await prisma.menus.update({
        where: { menuId: +menuId },
        data: { deletedAt: new Date() },
      });
      return res.status(200).json({ message: "메뉴를 삭제하였습니다" });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export default router;
