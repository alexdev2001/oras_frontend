import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`w-9 h-9 p-0 border-2 hover:bg-accent/50 transition-all duration-200 ${
        theme === 'light' 
          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm' 
          : ''
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
};
