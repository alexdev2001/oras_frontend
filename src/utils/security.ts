// Security utilities for enhanced protection

// Token management with enhanced security
export const tokenManager = {
  // Use sessionStorage instead of localStorage for better security
  setToken: (token: string) => {
    try {
      sessionStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },

  getToken: (): string | null => {
    try {
      return sessionStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  removeToken: () => {
    try {
      sessionStorage.removeItem('authToken');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp < now;
    } catch (error) {
      return true; // If we can't decode, assume expired
    }
  }
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length
};

// Enhanced error handling to prevent information leakage
export const getSecureErrorMessage = (error: any): string => {
  // Don't expose detailed error messages to users
  if (error?.status === 401) {
    return 'Authentication failed. Please check your credentials.';
  }
  if (error?.status === 403) {
    return 'Access denied. You do not have permission to perform this action.';
  }
  if (error?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return 'An error occurred. Please try again.';
};

// API URL configuration with environment support
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.protocol === 'https:' ? 
    'https://localhost:8000' : 
    'http://localhost:8000');

// Content Security Policy helper
export const CSP_HEADER = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' http://localhost:8000 https://localhost:8000",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; ')
};
