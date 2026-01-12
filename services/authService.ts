
import { UserProfile } from "../types";

// Google Sheets Configuration
const SPREADSHEET_ID = "12uL04EOHxksb4Y7iD9epcafbUS41JzNLnJ7roZ7uD4o";
const SHEET_NAME = "Sheet1"; // Ganti dengan nama sheet jika berbeda

// Cache for user data (refresh setiap app start atau bisa di-refresh manual)
let USER_DB_CACHE: any[] = [];
let CACHE_TIMESTAMP = 0;
const CACHE_DURATION = 1 * 60 * 1000; // 1 menit - frequent refresh untuk update real-time dari Google Sheet

export interface LoginResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  token?: string;
}

// Fetch users dari Google Sheet (using public CSV export)
const fetchUsersFromGoogleSheet = async (): Promise<any[]> => {
  try {
    // URL untuk export Google Sheet sebagai CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.trim().split('\n').filter(line => line.length > 0);
    
    if (lines.length < 2) {
      console.warn('Google Sheet appears to be empty');
      return [];
    }
    
    // Get headers dari baris pertama
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const users = [];
    
    // Find email column index (bisa "email", "email pembeli", dll)
    const emailColumnIndex = headers.findIndex(h => 
      h.includes('email') || h.includes('pembeli') || h.includes('mail')
    );
    
    if (emailColumnIndex === -1) {
      console.error('Email column not found in sheet');
      return [];
    }
    
    console.log('Parsing Google Sheet - Email column index:', emailColumnIndex);
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const email = values[emailColumnIndex]?.trim() || '';
      
      if (email && email.includes('@')) {
        users.push({
          email: email,
          username: email.split('@')[0] || 'User',
          avatarUrl: '',
        });
        console.log('Added user:', email);
      }
    }
    
    console.log('Total users loaded from Google Sheet:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return [];
  }
};

// Get users dari cache atau fetch baru
const getUsers = async (): Promise<any[]> => {
  const now = Date.now();
  
  // Gunakan cache jika masih valid
  if (USER_DB_CACHE.length > 0 && (now - CACHE_TIMESTAMP) < CACHE_DURATION) {
    return USER_DB_CACHE;
  }
  
  // Fetch data baru
  USER_DB_CACHE = await fetchUsersFromGoogleSheet();
  CACHE_TIMESTAMP = now;
  
  return USER_DB_CACHE;
};

export const loginUser = async (email: string): Promise<LoginResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Fetch users dari Google Sheet
  const users = await getUsers();

  if (users.length === 0) {
    return { success: false, error: "Tidak dapat terhubung dengan database. Coba lagi." };
  }

  // Find User by email
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  // Validate Existence
  if (!user) {
    return { 
      success: false, 
      error: "Email tidak terdaftar. Hubungi admin untuk mendaftar." 
    };
  }

  // Success - Email ditemukan di Google Sheet
  const userProfile: UserProfile = {
    username: user.username,
    email: user.email,
    theme: 'dark',
    language: 'en',
    interests: [],
    isAdult: false,
    avatarUrl: user.avatarUrl || ''
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