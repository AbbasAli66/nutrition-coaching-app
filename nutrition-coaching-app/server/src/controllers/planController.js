import { z } from "zod";
import prisma from "../config/db.js";

// Validation Schema for creating/updating a Nutrition Plan
const planSchema = z.object({
  userId: z.string().uuid("Invalid client ID"),
  calories: z.number().int().positive("Calories must be a positive number"),
  protein: z.number().positive("Protein must be a positive number"),
  carbs: z.number().positive("Carbs must be a positive number"),
  fats: z.number().positive("Fats must be a positive number"),
  notes: z.string().optional(),
});

// Create or Update Active Nutrition Plan (Coach Only)
export const upsertNutritionPlan = async (req, res) => {
  try {
    const validatedData = planSchema.parse(req.body);

    const client = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Deactivate previous active plans for this client
    await prisma.nutritionPlan.updateMany({
      where: { userId: validatedData.userId, isActive: true },
      data: { isActive: false },
    });

    // Create new active plan
    const newPlan = await prisma.nutritionPlan.create({
      data: {
        userId: validatedData.userId,
        calories: validatedData.calories,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fats: validatedData.fats,
        notes: validatedData.notes || null,
        isActive: true,
      },
    });

    res.status(201).json({
      message: "Nutrition plan assigned successfully",
      plan: newPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Active Nutrition Plan for a Client
export const getActivePlan = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    const plan = await prisma.nutritionPlan.findFirst({
      where: {
        userId: targetUserId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) {
      return res.status(404).json({ message: "No active nutrition plan found" });
    }

    res.status(200).json({ plan });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};