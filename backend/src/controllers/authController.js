import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";
import { signToken } from "../middleware/authenticateJWT.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function avatarFromName(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

export async function register(req, res, next) {
  try {
    const { name, email, password, year } = req.body;

    if (!name || !email || !password || !year) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!/@wisc\.edu$/i.test(email)) {
      return res.status(400).json({ error: "Must use a @wisc.edu email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        year,
        avatar: avatarFromName(name),
      },
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Always responds 200 — never reveals whether an email is registered.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required" });
    }

    const genericResponse = {
      message: "If that email is registered, a reset link has been sent.",
    };

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    try {
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (err) {
      // Don't leak delivery failures to the caller, but log server-side.
      console.error("[forgotPassword] email send failed:", err);
    }

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding tokens for this user.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}
