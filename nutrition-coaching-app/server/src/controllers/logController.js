import { z } from "zod";
import prisma from "../config/db.js";

const mealItemSchema = z.object({
    name: z.string().min(1, "Food name is required"),
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fats: z.number().nonnegative(),
    mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]),
});

const logEntrySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    waterIntake: z.number().nonnegative().optional(),
    meals: z.array(mealItemSchema).min(1, "At least one meal item is required"),
});

//Log daily meal items

export const addDailyLog = async (req, res) => {
    try {
        const validateData = logEntrySchema.parse(req.body);
        const logDate = new Date(validateData.date);

        // Find or create the Dailylog entry for this user and date
        let dailyLog = await prisma.dailyLog.findUnique({
            where: {
                userId_date: {
                    userId: req.user.Id,
                    date: logDate,
                },
            },
        });

        if (!dailylog) {
            dailyLog = await prisma.dailyLog.create({
                date: {
                    userId: req.user.id,
                    date: logDate,
                    waterIntake: validateData.waterIntake || 0,
                },
            })
        }

        //Insert Meal Items
        const createdMeals = await prisma.mealItem.createMany({
            date: validateData.meals.map((meal) => ({
                dailyLogId: dailyLog.id,
                name: meal.name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                mealType: meal.mealType
            })),
        });

        res.status(201).json({
            message: "Meals logged successfully",
            dailyLogId: dailyLog.id,
            itemAdded: createdMeals.count,

        });
    }
    catch (error){
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors});
        }
        res.status(500).json({ message: "Server error", error: error.message});
    }
     };

     //Get Daily Log by Date with calculated totals
     export const getDailyLogByDate = async (req, res) => {
        try {
            const { date } = req.params;
            const targetUserId = req.query.userId || req.user.id;
            const log = await prisma.dailyLog.findUnique({
                where: {
                    userId_date: {
                        userId: targetUserId,
                        date: new Date(date),

                    },
                },
                include:{
                    meals: true,
                },
            });

            if (!log) {
                return res.status(200).json({
                    date,
                    totalCalories: 0,
                    totalProtein: 0,
                    totalCarbs: 0,
                    totalFats: 0,
                    meals: [],
                });
            }
        //Aggregate totals
        const totals = log.meals.reduce(
            (acc, item) => {
                acc.calories += item.calories;
                acc.protein += item.protein;
                acc.carbs += item.carbs;
                acc.fats += item.fats;
                return acc;
            },
            {calories: 0, protein: 0, carbs: 0, fats: 0}
        );
        res.status(200).json({
            id: log.id,
            date: log.date,
            waterIntake: log.waterIntake,
            totals,
            meals: log.meals,

        });
        } catch (error){
            res.status(500).json({ message: "Server error", error: error.message});
        }

        };
