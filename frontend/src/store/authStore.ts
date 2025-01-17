import create from 'zustand';
import axios from 'axios';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/token', 
        new URLSearchParams({
          'username': email,
          'password': password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } catch (error) {
      throw new Error('Login failed');
    }
  },

  register: async (email: string, password: string) => {
    try {
      await axios.post('http://localhost:8000/users/', {
        email,
        password,
      });
    } catch (error) {
      throw new Error('Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false });
  },
}));