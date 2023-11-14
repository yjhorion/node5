import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import { createOrders } from "../middlewares/error.handler/joi.error.definition.js";

const router = express.Router();

/* 메뉴 주문 */
router.post("/orders", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { menuId, quantity } = await createOrders.validateAsync(req.body);

    if (!menuId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "주문 최소 갯수를 맞춰주세요" });
    }

    const isCustomer = await prisma.userInfos.findFirst({
      where: { UserId: userId },
    });

    if (isCustomer.userType !== "CUSTOMER") {
      return res
        .status(401)
        .json({ message: "사업자 계정은 주문이 불가합니다" });
    }

    const menu = await prisma.menus.findFirst({
      where: { menuId: menuId },
    });

    if (!menu) {
      return res.status(400).json({ message: "존재하지 않는 메뉴입니다" });
    }

    const sellerId = await prisma.menus.findFirst({
      where: { menuId },
    });

    const order = await prisma.orders.create({
      data: {
        UserId: userId,
        MenuId: menuId,
        quantity,
        sellerId: sellerId.UserId,
      },
    });
    return res.status(201).json({ data: order });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* CUSTOMER BASED 주문 내역 조회 */
router.get("/orders", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const orders = await prisma.orders.findMany({
      where: { UserId: userId },
      orderBy: { createdAt: "desc" },
    });

    if (!orders) {
      return res.status(404).json({});
    }

    return res.status(200).json({ data: orders });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 사장님 주문내역 조회 */
router.get("/ordersOwner", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const isOwner = await prisma.userInfos.findFirst({
      where: { UserId: userId },
    });

    if (isOwner.userType !== "OWNER") {
      return res
        .status(401)
        .json({ message: "매장별 주문내역 조회는 사업자 계정만 가능합니다" });
    }

    const myOrder = await prisma.orders.findMany({
      where: { AND: [{ sellerId: userId }, { orderType: "PENDING" }] },
      orderBy: { createdAt: "desc" },
    });

    if (!myOrder) {
      return res.status(400).json({ message: "대기중인 주문이 없습니다" });
    }

    return res.status(202).json({ data: myOrder });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 주문 수락 */
router.patch(
  "/ordersOwner/:whichOrder/accept",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { whichOrder } = req.params;
      const { userId } = req.user;

      const isOwner = await prisma.userInfos.findFirst({
        where: { UserId: userId },
      });

      if (isOwner.userType !== "OWNER") {
        return res
          .status(401)
          .json({ message: "매장별 주문내역 조회는 사업자 계정만 가능합니다" });
      }

      const myOrders = await prisma.orders.findMany({
        where: { AND: [{ sellerId: userId }, { orderType: "PENDING" }] },
        orderBy: { createdAt: "desc" },
      });

      if (!myOrders || myOrders.length === 0) {
        return res.status(400).json({ message: "대기중인 주문이 없습니다" });
      }

      const currentOrder = myOrders[Number(whichOrder) - 1];

      const AcceptedOrder = await prisma.orders.update({
        where: { orderId: currentOrder.orderId },
        data: { orderType: "ACCEPT" },
      });

      return res
        .status(201)
        .json({ message: "주문이 수락되었습니다", data: AcceptedOrder });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

/* 주문 거절 */
router.patch(
  "/ordersOwner/:whichOrder/calcel",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { whichOrder } = req.params;
      const { userId } = req.user;

      const isOwner = await prisma.userInfos.findFirst({
        where: { UserId: userId },
      });

      if (isOwner.userType !== "OWNER") {
        return res
          .status(401)
          .json({ message: "매장별 주문내역 조회는 사업자 계정만 가능합니다" });
      }

      const myOrders = await prisma.orders.findMany({
        where: { AND: [{ sellerId: userId }, { orderType: "PENDING" }] },
        orderBy: { createdAt: "desc" },
      });

      if (!myOrders || myOrders.length === 0) {
        return res.status(400).json({ message: "대기중인 주문이 없습니다" });
      }

      const currentOrder = myOrders[Number(whichOrder) - 1];

      const CanceledOrder = await prisma.orders.update({
        where: { orderId: currentOrder.orderId },
        data: { orderType: "CALCEL" },
      });

      return res
        .status(201)
        .json({ message: "주문이 거절되었습니다", data: CanceledOrder });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export default router;
