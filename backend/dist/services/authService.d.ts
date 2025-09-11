import { IUser } from '../models/User';
import { RegisterInput, LoginInput } from '../utils/validators';
export declare class AuthService {
    static register(userData: RegisterInput): Promise<{
        user: IUser;
        token: string;
    }>;
    static login(credentials: LoginInput): Promise<{
        user: IUser;
        token: string;
    }>;
    static getUserById(userId: string): Promise<IUser | null>;
}
//# sourceMappingURL=authService.d.ts.map