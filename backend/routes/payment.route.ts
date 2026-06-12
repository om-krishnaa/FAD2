import {
  getAllPayments,
  getMyPayments,
  requestPayment,
  updatePayment,
} from "../controllers/payment.controller";
import { isAdmin, isAuth } from "../middlewares/auth.middleware";

const express = require("express");
const router = express.Router();

router.get("/my", isAuth, getMyPayments);
router.get("/", isAuth, isAdmin, getAllPayments);
router.post("/", isAuth, requestPayment);
router.patch("/:id", isAuth, isAdmin, updatePayment);

module.exports = router;
