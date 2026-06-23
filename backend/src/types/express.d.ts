import { AuthSessionPayload,RoomPayload } from "../utils/jwt.util";

declare global {
    namespace Express {
        interface Request{
            user?:AuthSessionPayload;
            room?:RoomPayload
        }
    }
}