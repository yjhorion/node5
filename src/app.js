import express from "express";
import cookieParser from "cookie-parser";
import logMiddleware from "./middlewares/log.middleware.js";

import UserRouter from "./routes/users.js";
import CategoryRouter from "./routes/category.js";
import MenuRouter from "./routes/menu.js";
import OrderRouter from "./routes/order.js";
import errorHandler from "./middlewares/error-handler.js";

const app = express();
const PORT = 3004;

app.use(logMiddleware);
app.use(express.json());
app.use(cookieParser()); // cookie를 req.cookies에 등록하는 미들웨어
app.use("/api", [UserRouter, CategoryRouter, MenuRouter, OrderRouter]);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});

export default app;
