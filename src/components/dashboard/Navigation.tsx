import { NavigationPage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Home, Heart, CheckSquare, Calendar, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playNavigationSound } from '@/lib/sounds';

interface NavigationProps {
  activePage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
}

const navigationItems = [
  { page: 'home' as const, icon: Home, label: 'Home' },
  { page: 'interests' as const, icon: Heart, label: 'Interests' },
  { page: 'tasks' as const, icon: CheckSquare, label: 'Tasks' },
  { page: 'events' as const, icon: Calendar, label: 'Events' },
];

export const Navigation = ({ activePage, onPageChange }: NavigationProps) => {
  const handlePageChange = (page: NavigationPage) => {
    if (page !== activePage) {
      playNavigationSound();
      onPageChange(page);
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-10 bg-card/95 backdrop-blur-sm border rounded-2xl p-3 shadow-lg">
      <div className="flex flex-col gap-3">
        {navigationItems.map(({ page, icon: Icon, label }) => (
          <Button
            key={page}
            variant={activePage === page ? "default" : "ghost"}
            size="icon"
            onClick={() => handlePageChange(page)}
            className={cn(
              "w-12 h-12 rounded-full transition-all duration-300 group relative",
              activePage === page 
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-110" 
                : "hover:bg-accent hover:scale-105"
            )}
            title={label}
          >
            <Icon size={20} />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {label}
            </div>
          </Button>
        ))}
        {/* Discrete settings shortcut */}
        <div className="h-px bg-border/60 mx-2" />
        <Button
          variant={activePage === 'settings' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => handlePageChange('settings')}
          className={cn(
            'w-12 h-12 rounded-full transition-all duration-300 group relative',
            activePage === 'settings'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-110'
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-accent hover:scale-105'
          )}
          title="Settings"
          aria-label="Settings"
        >
          <Camera size={18} />
          <div className="absolute right-full mr-3 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Settings
          </div>
        </Button>
      </div>
    </div>
  );
};