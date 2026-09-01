import { z } from "zod";
import prisma from "../config/db.js";

// Validation Schema
const planSchema = z.object({
  userId: z.string().min(1, "Client ID is required"),
  caloriesTarget: z.coerce.number().int().positive("Calories must be a positive integer"),
  proteinTarget: z.coerce.number().positive("Protein must be a positive number"),
  carbsTarget: z.coerce.number().positive("Carbs must be a positive number"),
  fatsTarget: z.coerce.number().positive("Fats must be a positive number"),
});

// Fetch all clients for the Coach Command Center roster
export const getCoachClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        nutritionPlans: {
          where: { isActive: true },
          take: 1,
        },
        dailyLogs: {
          orderBy: { date: "desc" },
          take: 1,
        },
        checkIns: {
          where: { reviewed: false },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create or Update Active Nutrition Plan (Coach Only)
export const upsertNutritionPlan = async (req, res) => {
  try {
    const payload = {
      userId: req.body.userId || req.body.clientId,
      caloriesTarget: req.body.caloriesTarget ?? req.body.calories ?? req.body.targetCalories,
      proteinTarget: req.body.proteinTarget ?? req.body.protein,
      carbsTarget: req.body.carbsTarget ?? req.body.carbs ?? req.body.carbohydrates,
      fatsTarget: req.body.fatsTarget ?? req.body.fats,
    };

    const validatedData = planSchema.parse(payload);

    const client = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Deactivate existing active plans for this client
    await prisma.nutritionPlan.updateMany({
      where: { userId: validatedData.userId, isActive: true },
      data: { isActive: false },
    });

    // Create new active plan
    const newPlan = await prisma.nutritionPlan.create({
      data: {
        userId: validatedData.userId,
        caloriesTarget: validatedData.caloriesTarget,
        proteinTarget: validatedData.proteinTarget,
        carbsTarget: validatedData.carbsTarget,
        fatsTarget: validatedData.fatsTarget,
        isActive: true,
      },
    });

    return res.status(201).json({
      message: "Nutrition plan assigned successfully",
      plan: newPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Failed:", error.errors);
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Plan Upsert Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Active Nutrition Plan for a Client
export const getActivePlan = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user?.id || req.user?.userId;

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID could not be identified from token or params" });
    }

    const plan = await prisma.nutritionPlan.findFirst({
      where: {
        userId: targetUserId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Return 200 with plan: null so the client dashboard renders defaults without throwing 404
    return res.status(200).json({ plan: plan || null });
  } catch (error) {
    console.error("Get Active Plan Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};