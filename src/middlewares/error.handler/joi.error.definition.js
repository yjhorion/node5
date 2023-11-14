import joi from "joi";

const validAccountInfo = joi.object({
  nickname: joi.string().min(3).max(20),
  password: joi.string(),
  userType: joi.string().valid("OWNER", "CUSTOMER"),
});

const createMenues = joi.object({
  name: joi.string(),
  order: joi.number(),
  description: joi.string(),
  image: joi.string(),
  price: joi.number().min(1).max(1000000),
  status: joi.string().valid("FOR_SALE", "SOLD_OUT"),
});

const createCategories = joi.object({
  name: joi.string(),
  order: joi.number(),
});

const createOrders = joi.object({
  menuId: joi.number(),
  quantity: joi.number(),
});

export { validAccountInfo, createMenues, createCategories, createOrders };
