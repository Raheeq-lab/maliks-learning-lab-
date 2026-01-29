import React from 'react';
import { Button } from "@/components/ui/button";
import ThemeToggle from '@/components/ThemeToggle';

interface DashboardHeaderProps {
  teacherName: string;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ teacherName, onLogout }) => {
  return (
    <header className="bg-bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors duration-300">
      <div className="main-container py-3 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-focus-blue to-purple-600 flex items-center justify-center text-white font-bold shadow-md text-sm">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-focus-blue to-purple-600">
              Malik's Learning Lab
            </h1>
          </div>
          <span className="bg-success-green-light/50 text-success-green text-[10px] font-bold px-2 py-0.5 rounded-full border border-success-green/20 uppercase tracking-wider ml-1">
            v2.1
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-6 w-px bg-border hidden sm:block"></div>
          <div className="flex items-center gap-2 hidden sm:flex">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-text-primary leading-none">{teacherName}</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wide">Teacher</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-error-coral hover:text-error-coral hover:bg-error-coral-light/20 font-medium h-8 text-xs"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
