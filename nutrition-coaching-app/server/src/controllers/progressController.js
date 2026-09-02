import { z } from "zod";
import prisma from "../config/db.js";

// Validation Schema for progress Check-in
export const checkInSchema = z.object({
  weight: z.number().positive("Weight must be a positive number"),
  waistCircumference: z.number().positive().optional(),
  notes: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
});

// Submit a new weekly check-in (Client)
export const submitCheckIn = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const {
      weight,
      averageWeight,
      notes,
      clientNotes,
      energyLevel,
      energyRating,
      digestionRating,
      sleepHours,
      adherenceScore,
    } = req.body;

    if (!weight && !averageWeight) {
      return res.status(400).json({ message: "Weight is required for check-in" });
    }

    const resolvedWeight = parseFloat(averageWeight || weight);
    const parsedEnergy = energyRating
      ? parseInt(energyRating)
      : (energyLevel ? parseInt(energyLevel) : 8);
    const parsedDigestion = digestionRating ? parseInt(digestionRating) : 8;
    const parsedSleepHours = sleepHours ? parseFloat(sleepHours) : 7.5;
    const parsedAdherence = adherenceScore ? parseInt(adherenceScore) : 8;

    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        averageWeight: resolvedWeight,
        energyRating: parsedEnergy,
        digestionRating: parsedDigestion,
        sleepHours: parsedSleepHours,
        adherenceScore: parsedAdherence,
        clientNotes: clientNotes || notes || "",
        reviewed: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Check-in submitted successfully",
      checkIn,
    });
  } catch (error) {
    console.error("Error submitting check-in:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const addCheckIn = submitCheckIn;

// Get client check-in history
export const getClientCheckIns = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id || req.user?.userId;

    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      checkIns,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProgressHistory = getClientCheckIns;

// Get pending check-ins for coach review
export const getPendingCheckIns = async (req, res) => {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: { reviewed: false },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, checkIns });
  } catch (error) {
    console.error("Error fetching coach check-ins:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCoachClients = getPendingCheckIns;

// Review check-in handler (Coach action)
export const reviewCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.params;
    const { coachFeedback } = req.body;

    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        reviewed: true,
        coachFeedback: coachFeedback || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Check-in reviewed successfully",
      checkIn: updatedCheckIn,
    });
  } catch (error) {
    console.error("Error reviewing check-in:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};