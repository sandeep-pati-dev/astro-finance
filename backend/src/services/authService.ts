import User, { IUser } from '../models/User';
import { RegisterInput, LoginInput } from '../utils/validators';
import { generateToken } from '../middlewares/authMiddleware';

export class AuthService {
  static async register(userData: RegisterInput): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken((user._id as any).toString());

    return { user, token };
  }

  static async login(credentials: LoginInput): Promise<{ user: IUser; token: string }> {
    const { email, password } = credentials;

    // Find user and check password
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken((user._id as any).toString());

    return { user, token };
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }
}
