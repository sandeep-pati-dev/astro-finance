import { IUser } from '@/models/User';
import { UserProfileInput } from '@/utils/validators';
export declare class UserService {
    static updateUserProfile(userId: string, updateData: UserProfileInput): Promise<IUser | null>;
    static getUserProfile(userId: string): Promise<IUser | null>;
    static deleteUser(userId: string): Promise<IUser | null>;
}
//# sourceMappingURL=userService.d.ts.map