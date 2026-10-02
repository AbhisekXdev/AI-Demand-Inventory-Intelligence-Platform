import express from "express";

import {
    getDemandForecast,getMovingAverageForecast,evaluateForecast,predictDemand
} from "../controllers/forecast.controller.js";

const router = express.Router();


// Forecast demand for a product
router.get(
    "/product/:productId",
    getDemandForecast
);
router.get(
    "/moving-average/product/:productId",
    getMovingAverageForecast
);
router.get(
    "/evaluate/product/:productId",
    evaluateForecast
);
router.get(
    "/predict/product/:productId",
    predictDemand
);


export default router;