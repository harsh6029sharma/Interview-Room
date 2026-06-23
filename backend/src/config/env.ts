export const env = {
  jwtAuthSecret: process.env.JWT_AUTH_SECRET!,
  jwtRoomSecret: process.env.JWT_ROOM_SECRET!,
  jwtAuthExpiry: process.env.JWT_AUTH_EXPIRY || "7d",
  jwtRoomExpiry: process.env.JWT_ROOM_EXPIRY || "4h",
};

// if any required secret key is missing
if (!env.jwtAuthSecret || !env.jwtRoomSecret) {
  throw new Error("Missing JWT secrets in .env");
}