const DEFAULT_JWT_EXPIRES_IN = "1h";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN,
  get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET must be set before using the authentication API.");
    }

    return secret;
  },
};
