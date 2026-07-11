import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

import prisma from "../config/prisma";
import { signAccessToken } from "../utils/auth";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Credentials = {
  email: string;
  password: string;
};

type RegistrationInput = Credentials & {
  name: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseCredentials = (body: unknown): Credentials | null => {
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string") {
    return null;
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email) ||
    password.length < MIN_PASSWORD_LENGTH ||
    Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES
  ) {
    return null;
  }

  return { email, password };
};

const parseRegistration = (body: unknown): RegistrationInput | null => {
  const credentials = parseCredentials(body);

  if (!credentials || !isRecord(body) || typeof body.name !== "string") {
    return null;
  }

  const name = body.name.trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    return null;
  }

  return { ...credentials, name };
};

const userResponse = (user: { id: number; email: string; name: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials = parseCredentials(req.body);
    if (!credentials) {
      res.status(400).json({
        message: "Provide a valid email and a password between 8 and 72 bytes.",
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: credentials.email } });
    const passwordMatches = user
      ? await bcrypt.compare(credentials.password, user.password)
      : false;

    if (!user || !passwordMatches) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    res.status(200).json({
      message: "Login successful.",
      token: signAccessToken(user.id),
      user: userResponse(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const input = parseRegistration(req.body);
    if (!input) {
      res.status(400).json({
        message: "Provide a name, a valid email, and a password between 8 and 72 bytes.",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const password = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name, password },
    });

    res.status(201).json({
      message: "User registered successfully.",
      token: signAccessToken(user.id),
      user: userResponse(user),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    console.error("Registration failed:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Access tokens are stateless. The client must discard the token on logout.
export const logout = (_req: Request, res: Response): void => {
  res.sendStatus(204);
};
