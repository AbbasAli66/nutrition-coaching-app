import prisma from "../config/db.js";
import { z } from "zod";

// Validation schema for creating/updating a nutrition plan
export const nutritionPlanSchema = z.object({
  clientId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().optional(),
  caloriesTarget: z.union([z.number(), z.string()]).transform((val) => parseFloat(val)),
  proteinTarget: z.union([z.number(), z.string()]).transform((val) => parseFloat(val)),
  carbsTarget: z.union([z.number(), z.string()]).transform((val) => parseFloat(val)),
  fatsTarget: z.union([z.number(), z.string()]).transform((val) => parseFloat(val)),
});

// 1. Get Active Plan for the Authenticated Client
export const getActivePlan = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "User session unauthorized or token missing" });
    }

    // Set cache-busting headers to prevent stale 304 caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Fetch the client's most recent plan
    const plan = await prisma.nutritionPlan.findFirst({
      where: {
        userId: currentUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      plan: plan || null,
    });
  } catch (error) {
    console.error("Error fetching active plan:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching active plan",
      error: error.message,
    });
  }
};

// 2. Create or Assign a Nutrition Plan (Coach Action)
export const createOrAssignPlan = async (req, res) => {
  try {
    const coachId = req.user?.id || req.user?.userId;
    const {
      clientId,
      userId,
      title,
      notes,
      protocolNotes,
      coachNotes,
      caloriesTarget,
      proteinTarget,
      carbsTarget,
      fatsTarget,
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFats,
    } = req.body;

    const targetClientId = clientId || userId;

    if (!targetClientId) {
      return res.status(400).json({
        success: false,
        message: "Target client ID is required to prescribe a plan",
      });
    }

    const resolvedCalories = parseFloat(caloriesTarget ?? dailyCalories ?? 2000);
    const resolvedProtein = parseFloat(proteinTarget ?? dailyProtein ?? 150);
    const resolvedCarbs = parseFloat(carbsTarget ?? dailyCarbs ?? 200);
    const resolvedFats = parseFloat(fatsTarget ?? dailyFats ?? 60);
    const resolvedNotes = notes || protocolNotes || coachNotes || "";

    // Build data object dynamically to prevent Prisma unknown field errors
    const planData = {
      userId: targetClientId,
      title: title || "Nutrition Target Plan",
      // Target variations
      caloriesTarget: resolvedCalories,
      proteinTarget: resolvedProtein,
      carbsTarget: resolvedCarbs,
      fatsTarget: resolvedFats,
    };

    // If your schema also has coachId, attach it
    if (coachId) {
      planData.coachId = coachId;
    }

    // Try creating with target schema structure
    let newPlan;
    try {
      newPlan = await prisma.nutritionPlan.create({
        data: planData,
      });
    } catch (primaryErr) {
      // Fallback in case schema uses dailyCalories / dailyProtein / notes
      console.warn("Retrying with daily* schema variation...", primaryErr.message);
      newPlan = await prisma.nutritionPlan.create({
        data: {
          userId: targetClientId,
          title: title || "Nutrition Target Plan",
          dailyCalories: resolvedCalories,
          dailyProtein: resolvedProtein,
          dailyCarbs: resolvedCarbs,
          dailyFats: resolvedFats,
          notes: resolvedNotes,
          ...(coachId ? { coachId } : {}),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Nutrition plan assigned successfully",
      plan: newPlan,
    });
  } catch (error) {
    console.error("Error assigning nutrition plan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create nutrition plan",
    });
  }
};

// 3. Get All Gym Clients with their Plans (Coach View)
export const getCoachClients = async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        nutritionPlans: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Error fetching coach clients:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching client roster",
      error: error.message,
    });
  }
};

// Export aliases to satisfy all imported names across route files
export const createPlan = createOrAssignPlan;
export const upsertNutritionPlan = createOrAssignPlan;
export const updatePlan = createOrAssignPlan;
export const getClients = getCoachClients; 