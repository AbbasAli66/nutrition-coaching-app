import { z } from "zod";
import prisma from "../config/db.js";

//Validation Schema for progress Check-in
const checkInSchema = z.object({
    weight: z.number().positive("Weight must be a positive number"),
    waistCircumference: z.number().positive().optional,
    notes: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),

});

//Submit a weekly / daily progress check-in
export const addCheckIn = async (req, res) => {
    try {
        const validateData = checkInSchema.parse(req.body);
        const checkInDate = validateData.date ? new Date(validateData.date) : new Date();
        const checkIn = await prisma.progressCheckIn.create({
            data: {
                userId: req.user.id,
                weight: validateData.weight,
                waistCircumference: validateData.waistCircumference || null,
                notes: validateData.notes || null,
                createdAt: checkInDate,
            },
        });
        res.status(201).json({
            message: "Progress check-in logged successfully",
            checkIn,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({error: error.errors });
        }
        res.status(500).json({ message: "Server error", error: error.message});
    }
};
//Get progress history (weight over time) for a client 
export const getProgressHistory = async (req, res) => {
    try {
        const targetUserId = req.params.userId || req.user.id;
        //Check authorization if a coach is requesting client data
        if (req.user.role === "CLIENT" && targetUserId !== req.user.id) {
            return res.status(403).json({ message: "Access denied"});
        }
        const history = await prisma.progressCheckIn.findMany({
            where: { userId: targetUserId},
            orderBy: { createdAt: "asc"},
        });
        res.status(200).json({ history });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });

    }
};
//get coach's client roster with their latest active plan & recent log count 
export const getCoachClients = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { coachId: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        nutritionPlans: {
          where: { isActive: true },
          take: 1,
        },
        progressCheckIns: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.status(200).json({ clients });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};