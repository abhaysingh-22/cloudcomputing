import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

const router = Router();

const credentials = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

function signToken(userId: string) {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });

    res.status(201).json({
        token: signToken(user.id),
        user: { id: user.id, email: user.email },
    });
});

router.post("/login", async (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!user || !valid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
        token: signToken(user.id),
        user: { id: user.id, email: user.email },
    });
});

export default router;