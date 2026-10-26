import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string };

    // The token is valid, but does the user still exist?
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!user) return res.status(401).json({ error: "User no longer exists" });

    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}