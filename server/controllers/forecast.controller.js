import Demand from "../models/Demand.js";
import Product from "../models/Product.js";



// Trend-Aware Demand Forecast


const getDemandForecast = async (req, res) => {
    try {
        const { productId } = req.params;

        const days = Number(req.query.days) || 7;

        if (days <= 0 || days > 90) {
            return res.status(400).json({
                success: false,
                message: "Days must be between 1 and 90",
            });
        }

        // Check product
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Get historical demand
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Not enough demand history",
                forecast: {
                    productId,
                    forecastDays: days,
                    predictedDemand: 0,
                    trend: "NO_DATA",
                },
            });
        }

        // ==========================================
        // Total Historical Demand
        // ==========================================

        const totalDemand = demands.reduce(
            (total, demand) =>
                total + Number(demand.quantity),
            0
        );

        // ==========================================
        // Historical Date Range
        // ==========================================

        const firstDate = new Date(
            demands[0].demandDate
        );

        const lastDate = new Date(
            demands[demands.length - 1].demandDate
        );

        const differenceInTime =
            lastDate.getTime() -
            firstDate.getTime();

        const historicalDays =
            Math.floor(
                differenceInTime /
                    (1000 * 60 * 60 * 24)
            ) + 1;

        const activeDays = Math.max(
            historicalDays,
            1
        );

        // ==========================================
        // Overall Average Daily Demand
        // ==========================================

        const averageDailyDemand =
            totalDemand / activeDays;

        // ==========================================
        // Recent Demand
        // ==========================================

        // Use the latest 7 demand records
        const recentDemands =
            demands.slice(-7);

        const recentTotalDemand =
            recentDemands.reduce(
                (total, demand) =>
                    total + Number(demand.quantity),
                0
            );

        const recentAverageDemand =
            recentTotalDemand /
            recentDemands.length;

        // ==========================================
        // Determine Demand Trend
        // ==========================================

        let trend = "STABLE";

        const difference =
            recentAverageDemand -
            averageDailyDemand;

        const trendPercentage =
            averageDailyDemand > 0
                ? (difference /
                      averageDailyDemand) *
                  100
                : 0;

        if (trendPercentage >= 10) {
            trend = "INCREASING";
        } else if (trendPercentage <= -10) {
            trend = "DECREASING";
        }

        // ==========================================
        // Trend Adjustment
        // ==========================================

        let trendAdjustedDailyDemand;

        if (trend === "INCREASING") {
            trendAdjustedDailyDemand =
                averageDailyDemand * 1.10;
        } else if (trend === "DECREASING") {
            trendAdjustedDailyDemand =
                averageDailyDemand * 0.90;
        } else {
            trendAdjustedDailyDemand =
                averageDailyDemand;
        }

        // ==========================================
        // Future Forecast
        // ==========================================

        const predictedDemand =
            trendAdjustedDailyDemand * days;

        // ==========================================
        // Simple Confidence
        // ==========================================

        let confidence = 0.5;

        if (demands.length >= 30) {
            confidence = 0.8;
        } else if (demands.length >= 14) {
            confidence = 0.7;
        } else if (demands.length >= 7) {
            confidence = 0.6;
        }

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            forecast: {
                forecastDays: days,

                historicalDays: activeDays,

                recordCount: demands.length,

                totalHistoricalDemand:
                    totalDemand,

                averageDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(2)
                    ),

                recentAverageDemand:
                    Number(
                        recentAverageDemand.toFixed(2)
                    ),

                trend,

                trendPercentage:
                    Number(
                        trendPercentage.toFixed(2)
                    ),

                trendAdjustedDailyDemand:
                    Number(
                        trendAdjustedDailyDemand.toFixed(2)
                    ),

                predictedDemand:
                    Number(
                        predictedDemand.toFixed(2)
                    ),

                confidence,
            },
        });

    } catch (error) {
        console.error(
            "Demand Forecast Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Moving Average Forecast


const getMovingAverageForecast = async (req, res) => {
    try {
        const { productId } = req.params;

        const window = Number(req.query.window) || 7;
        const forecastDays =
            Number(req.query.days) || 7;

        if (![7, 14, 30].includes(window)) {
            return res.status(400).json({
                success: false,
                message: "Window must be 7, 14, or 30 days",
            });
        }

        if (forecastDays <= 0 || forecastDays > 90) {
            return res.status(400).json({
                success: false,
                message: "Forecast days must be between 1 and 90",
            });
        }

        // Check product
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Get demand history
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Not enough demand history",
                forecast: {
                    predictedDemand: 0,
                },
            });
        }

        // ==========================================
        // Aggregate demand by date
        // ==========================================

        const dailyDemandMap = {};

        demands.forEach((demand) => {
            const date = demand.demandDate;

            if (!dailyDemandMap[date]) {
                dailyDemandMap[date] = 0;
            }

            dailyDemandMap[date] += Number(
                demand.quantity
            );
        });

        // ==========================================
        // Get last N days
        // ==========================================

        const dailyValues =
            Object.values(dailyDemandMap);

        const recentValues =
            dailyValues.slice(-window);

        if (recentValues.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Not enough demand history",
                forecast: {
                    predictedDemand: 0,
                },
            });
        }

        // ==========================================
        // Calculate Moving Average
        // ==========================================

        const recentTotal =
            recentValues.reduce(
                (total, quantity) =>
                    total + Number(quantity),
                0
            );

        const movingAverage =
            recentTotal / recentValues.length;

        // ==========================================
        // Forecast
        // ==========================================

        const predictedDemand =
            movingAverage * forecastDays;

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            forecast: {
                method: "MOVING_AVERAGE",

                windowDays: window,

                forecastDays,

                recordsUsed:
                    recentValues.length,

                movingAverage:
                    Number(
                        movingAverage.toFixed(2)
                    ),

                predictedDailyDemand:
                    Number(
                        movingAverage.toFixed(2)
                    ),

                predictedDemand:
                    Number(
                        predictedDemand.toFixed(2)
                    ),
            },
        });

    } catch (error) {
        console.error(
            "Moving Average Forecast Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// ==========================================
// Forecast Evaluation - MAE
// ==========================================

// ==========================================
// Automatic Forecast Model Evaluation
// ==========================================

const evaluateForecast = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Get demand history
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        // ==========================================
        // Aggregate demand by date
        // ==========================================

        const dailyDemandMap = {};

        demands.forEach((demand) => {
            const date = demand.demandDate;

            if (!dailyDemandMap[date]) {
                dailyDemandMap[date] = 0;
            }

            dailyDemandMap[date] += Number(
                demand.quantity
            );
        });

        const dailyValues = Object.values(
            dailyDemandMap
        ).map(Number);

        if (dailyValues.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "At least 2 days of demand history are required",
            });
        }

        // ==========================================
        // Calculate Baseline MAE
        // ==========================================

        let baselineError = 0;
        let baselineCount = 0;

        for (let i = 1; i < dailyValues.length; i++) {
            const historicalValues =
                dailyValues.slice(0, i);

            const predicted =
                historicalValues.reduce(
                    (sum, value) => sum + value,
                    0
                ) / historicalValues.length;

            const actual = dailyValues[i];

            baselineError += Math.abs(
                actual - predicted
            );

            baselineCount++;
        }

        const baselineMAE =
            baselineError / baselineCount;

        // ==========================================
        // Evaluate Moving Average
        // ==========================================

        const windows = [7, 14, 30];

        const movingAverageResults = [];

        for (const window of windows) {
            // Not enough data for this window
            if (dailyValues.length <= window) {
                movingAverageResults.push({
                    windowDays: window,
                    available: false,
                    message: `Requires at least ${
                        window + 1
                    } days of data`,
                });

                continue;
            }

            let totalError = 0;
            let predictionCount = 0;

            for (
                let i = window;
                i < dailyValues.length;
                i++
            ) {
                const trainingValues =
                    dailyValues.slice(
                        i - window,
                        i
                    );

                const predicted =
                    trainingValues.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ) / trainingValues.length;

                const actual =
                    dailyValues[i];

                totalError += Math.abs(
                    actual - predicted
                );

                predictionCount++;
            }

            const mae =
                totalError /
                predictionCount;

            movingAverageResults.push({
                windowDays: window,
                available: true,
                recordsEvaluated:
                    predictionCount,
                mae: Number(
                    mae.toFixed(2)
                ),
            });
        }

        // ==========================================
        // Find lowest MAE
        // ==========================================

        const availableModels =
            movingAverageResults.filter(
                (model) => model.available
            );

        let selectedModel = null;

        if (availableModels.length > 0) {
            selectedModel =
                availableModels.reduce(
                    (best, current) =>
                        current.mae < best.mae
                            ? current
                            : best
                );
        }

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            data: {
                dailyRecords:
                    dailyValues.length,
            },

            evaluation: {
                baseline: {
                    available: true,
                    mae: Number(
                        baselineMAE.toFixed(2)
                    ),
                },

                movingAverage:
                    movingAverageResults,

                selectedModel: selectedModel
                    ? {
                          method:
                              "MOVING_AVERAGE",
                          windowDays:
                              selectedModel.windowDays,
                          mae:
                              selectedModel.mae,
                      }
                    : null,
            },
        });

    } catch (error) {
        console.error(
            "Automatic Forecast Evaluation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



// Final Demand Prediction


const predictDemand = async (req, res) => {
    try {
        const { productId } = req.params;

        const forecastDays =
            Number(req.query.days) || 7;

        if (forecastDays <= 0 || forecastDays > 90) {
            return res.status(400).json({
                success: false,
                message:
                    "Forecast days must be between 1 and 90",
            });
        }

        // ==========================================
        // Find Product
        // ==========================================

        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // ==========================================
        // Get Demand History
        // ==========================================

        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        // ==========================================
        // Aggregate Demand By Date
        // ==========================================

        const dailyDemandMap = {};

        demands.forEach((demand) => {
            const date = demand.demandDate;

            if (!dailyDemandMap[date]) {
                dailyDemandMap[date] = 0;
            }

            dailyDemandMap[date] += Number(
                demand.quantity
            );
        });

        const dailyValues = Object.values(
            dailyDemandMap
        ).map(Number);

        // ==========================================
        // Minimum Data Validation
        // ==========================================

        if (dailyValues.length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "At least 2 days of demand history are required",
            });
        }

        // ==========================================
        // Available Forecast Windows
        // ==========================================

        const possibleWindows = [30, 14, 7];

        const availableWindows =
            possibleWindows.filter(
                (window) =>
                    dailyValues.length > window
            );

        let selectedWindow;
        let selectedMAE = null;

        // ==========================================
        // If less than 8 days of data
        // use all available history
        // ==========================================

        if (availableWindows.length === 0) {
            selectedWindow = dailyValues.length;

            selectedMAE = null;
        } else {
            // ==========================================
            // Find Best Moving Average Window
            // ==========================================

            let bestWindow = null;
            let bestMAE = Infinity;

            for (const window of availableWindows) {
                let totalError = 0;
                let predictionCount = 0;

                for (
                    let i = window;
                    i < dailyValues.length;
                    i++
                ) {
                    const trainingValues =
                        dailyValues.slice(
                            i - window,
                            i
                        );

                    const predicted =
                        trainingValues.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) /
                        trainingValues.length;

                    const actual =
                        dailyValues[i];

                    const absoluteError =
                        Math.abs(
                            actual - predicted
                        );

                    totalError +=
                        absoluteError;

                    predictionCount++;
                }

                const mae =
                    totalError /
                    predictionCount;

                if (mae < bestMAE) {
                    bestMAE = mae;
                    bestWindow = window;
                }
            }

            selectedWindow = bestWindow;
            selectedMAE = bestMAE;
        }

        // ==========================================
        // Calculate Final Forecast
        // ==========================================

        const recentValues =
            dailyValues.slice(-selectedWindow);

        const averageDailyDemand =
            recentValues.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) /
            recentValues.length;

        const predictedDemand =
            averageDailyDemand *
            forecastDays;

        // ==========================================
        // Response
        // ==========================================

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            forecast: {
                method:
                    selectedMAE === null
                        ? "BASELINE"
                        : "MOVING_AVERAGE",

                windowDays: selectedWindow,

                forecastDays,

                recordsUsed:
                    recentValues.length,

                averageDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(2)
                    ),

                predictedDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(2)
                    ),

                predictedDemand:
                    Number(
                        predictedDemand.toFixed(2)
                    ),

                modelMAE:
                    selectedMAE === null
                        ? null
                        : Number(
                              selectedMAE.toFixed(
                                  2
                              )
                          ),
            },
        });

    } catch (error) {
        console.error(
            "Demand Prediction Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export {
    getDemandForecast,getMovingAverageForecast,evaluateForecast,predictDemand
};