import { z } from "zod";
import prisma from "../config/db.js";

// Helper to normalize dates to midnight UTC
const getMidnightDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Zod Schema with flexible coercion
const mealItemSchema = z.object({
  date: z.string().optional(),
  name: z.string().min(1, "Meal name is required"),
  mealType: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"])
  ),
  calories: z.coerce.number().min(0, "Calories must be positive"),
  protein: z.coerce.number().min(0, "Protein must be positive"),
  carbs: z.coerce.number().min(0, "Carbs must be positive"),
  fats: z.coerce.number().min(0, "Fats must be positive"),
  servingQty: z.coerce.number().positive().default(1),
});

// Zod Schema for daily metrics
const dailyMetricsSchema = z.object({
  date: z.string().optional(),
  weight: z.coerce.number().positive().optional().nullable(),
  waterIntakeMl: z.coerce.number().int().min(0).optional(),
});

// GET /api/logs/:date or /api/logs/today
export const getDailyLog = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const dateParam = req.params.date === "today" ? undefined : req.params.date || req.query.date;
    const targetDate = getMidnightDate(dateParam);

    let dailyLog = await prisma.dailyLog.findFirst({
      where: {
        userId: targetUserId,
        date: targetDate,
      },
      include: {
        meals: true,
      },
    });

    if (!dailyLog) {
      dailyLog = await prisma.dailyLog.create({
        data: {
          userId: targetUserId,
          date: targetDate,
          waterIntakeMl: 0,
        },
        include: {
          meals: true,
        },
      });
    }

    const activePlan = await prisma.nutritionPlan.findFirst({
      where: { userId: targetUserId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const totals = (dailyLog.meals || []).reduce(
      (acc, meal) => {
        const qty = meal.servingQty || 1;
        acc.calories += meal.calories * qty;
        acc.protein += meal.protein * qty;
        acc.carbs += meal.carbs * qty;
        acc.fats += meal.fats * qty;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return res.status(200).json({
      dailyLog,
      totals,
      activePlan: activePlan || null,
    });
  } catch (error) {
    console.error("Get Daily Log Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/logs or /api/logs/meal
export const addMealItem = async (req, res) => {
  try {
    // Map alternate frontend keys (e.g., category, mealCategory) to mealType
    const payload = { ...req.body };
    if (!payload.mealType && (payload.category || payload.mealCategory)) {
      payload.mealType = payload.category || payload.mealCategory;
    }

    const validatedData = mealItemSchema.parse(payload);
    const targetDate = getMidnightDate(validatedData.date);

    let dailyLog = await prisma.dailyLog.findFirst({
      where: {
        userId: req.user.id,
        date: targetDate,
      },
    });

    if (!dailyLog) {
      dailyLog = await prisma.dailyLog.create({
        data: {
          userId: req.user.id,
          date: targetDate,
        },
      });
    }

    const mealItem = await prisma.mealItem.create({
      data: {
        dailyLogId: dailyLog.id,
        name: validatedData.name,
        mealType: validatedData.mealType,
        calories: validatedData.calories,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fats: validatedData.fats,
        servingQty: validatedData.servingQty || 1,
      },
    });

    return res.status(201).json({
      message: "Meal item logged successfully",
      mealItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error Details:", error.errors);
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Add Meal Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/logs/meal/:mealId
export const deleteMealItem = async (req, res) => {
  try {
    const { mealId } = req.params;

    const meal = await prisma.mealItem.findUnique({
      where: { id: mealId },
      include: { dailyLog: true },
    });

    if (!meal || meal.dailyLog.userId !== req.user.id) {
      return res.status(404).json({ message: "Meal item not found or unauthorized" });
    }

    await prisma.mealItem.delete({
      where: { id: mealId },
    });

    return res.status(200).json({ message: "Meal item deleted successfully" });
  } catch (error) {
    console.error("Delete Meal Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/logs/metrics
export const updateDailyMetrics = async (req, res) => {
  try {
    const validatedData = dailyMetricsSchema.parse(req.body);
    const targetDate = getMidnightDate(validatedData.date);

    const updateData = {};
    if (validatedData.weight !== undefined) updateData.weight = validatedData.weight;
    if (validatedData.waterIntakeMl !== undefined) updateData.waterIntakeMl = validatedData.waterIntakeMl;

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: targetDate,
        },
      },
      update: updateData,
      create: {
        userId: req.user.id,
        date: targetDate,
        ...updateData,
      },
    });

    return res.status(200).json({
      message: "Daily metrics updated",
      dailyLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Update Metrics Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};