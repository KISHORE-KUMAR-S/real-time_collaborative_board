// Centralized environment config. Read once, validated, reused everywhere.

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  defaultBoardId:
    process.env.DEFAULT_BOARD_ID ?? "11111111-1111-1111-1111-111111111111",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};
