import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

export const signAccessToken = (userId: number): string =>
  jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
