import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/db.js";

//validation schemas
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().includes("@", { message: "Invalid email address"}),
    password: z.string().min(6, "password must be at least 6 characters"),
    role: z.enum(["COACH", "CLIENT"]).optional(),
    coachId: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().includes("@", { message: "Invalid email format"}),
    password: z.string().min(1, "Password is required"),
});

//Register user
export const register = async (red, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingData = await prisma.user.findUnique({
            where: {email: validateData.email},
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered"});

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validatedData.password, salt);

        const newUser = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
                role: validatedData.role || "CLIENT",
                coachId: validatedData.coachId || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: "7d"});

            res.status(201).json({
                message: "User registered successfully",
                user: newUser,
                token,
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({error: error.errors})
            }
            res.status(500).json({message: "Server error", error: error.me});
        }
       };
       //Login user
export const login = async (req, res) => {
    try {
       const validatedData = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
        where: {email: validatedData.email},

        });
        if (!user) {
            return res.status(400).json({message: "Invalid email or password"});

        }
        const isMatch = await bcrypt.compare(validateData.password, user.password);
        if (!isMatch) {
            return res.status(400).json({message: "Invalid email or password"});
    }
    const token = jwt.sign(
        {id: user.id, email: user.email, role: user.role},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    );
    res.status(200).json({
        message: "Login successful",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token
    });
   }

   catch (error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({error: error.errors});
     
    }
    res.status(500).json({message: "Server error", error: error.message});
}
   };

   //Get Logged in User profile
   export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {id: req.user.id},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                coachId: true,
                createdAt: true,
            }
        });
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({ user });
       }catch (error) {
        res.status(500).json({message: "Server error", error: error.message});

       }
    };