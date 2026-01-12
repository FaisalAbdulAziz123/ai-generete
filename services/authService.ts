
import { UserProfile } from "../types";

// --- MOCK DATABASE ---
// In a real app, this would be your Stripe/Firebase/Supabase DB
const MOCK_USER_DB = [
  {
    email: "user@plow.ai",
    password: "password123", // In real app: hashed
    username: "PlowCreator",
    status: "PAID",
    avatarUrl: "",
  },
  {
    email: "free@plow.ai",
    password: "password123",
    username: "FreeUser",
    status: "UNPAID", // This user should be rejected
    avatarUrl: "",
  }
];

export interface LoginResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  token?: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 1. Find User
  const user = MOCK_USER_DB.find((u) => u.email.toLowerCase() === email.toLowerCase());

  // 2. Validate Existence
  if (!user) {
    return { success: false, error: "Email atau password salah." };
  }

  // 3. Validate Password (Simulated Hash Check)
  if (user.password !== password) {
    return { success: false, error: "Email atau password salah." };
  }

  // 4. Validate PAYMENT STATUS
  if (user.status !== "PAID") {
    return { 
      success: false, 
      error: "Akun belum aktif. Silakan melakukan pembelian untuk mendapatkan akses PLOW AI." 
    };
  }

  // 5. Success
  const userProfile: UserProfile = {
    username: user.username,
    email: user.email,
    theme: 'dark',
    language: 'en',
    interests: [],
    isAdult: false,
    avatarUrl: user.avatarUrl
  };

  return {
    success: true,
    user: userProfile,
    token: "mock-jwt-token-" + Date.now(),
  };
};

export const logoutUser = () => {
  localStorage.removeItem("plow_auth_token");
  localStorage.removeItem("plow_user_data");
};