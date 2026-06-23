import 'dotenv/config'

export const env = {
  jwtAuthSecret: process.env.JWT_AUTH_SECRET!,
  jwtRoomSecret: process.env.JWT_ROOM_SECRET!,
  jwtAuthExpiry: 60 * 60 * 24 * 7,   // 7 days
  jwtRoomExpiry: 60 * 60 * 4,        // 4 hours
};

if (!env.jwtAuthSecret || !env.jwtRoomSecret) {
  throw new Error("Missing JWT secrets in .env");
}