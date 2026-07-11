import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

type AccessTokenPayload = JwtPayload & { userId: number };

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload =>
  typeof payload !== "string" && typeof payload.userId === "number";

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!isAccessTokenPayload(payload)) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.user = { id: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
