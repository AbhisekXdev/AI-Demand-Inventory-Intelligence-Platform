import express from "express";

import {
    getInventoryAlerts,
} from "../controllers/inventoryAlert.controller.js";

const router = express.Router();

router.get(
    "/",
    getInventoryAlerts
);

export default router;