import {
  handleEsewaSuccess,
  handleKhaltiCallback,
} from "../controllers/webhook.controller";

const express = require("express");
const router = express.Router();

router.get("/esewa/success", handleEsewaSuccess);
router.get("/esewa/success/mobile", handleEsewaSuccess);
router.get("/khalti/callback", handleKhaltiCallback);

module.exports = router;
