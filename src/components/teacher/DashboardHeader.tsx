
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  teacherName: string;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ teacherName, onLogout }) => {
  return (
    <header className="bg-quiz-purple text-white shadow-md">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Malik's Learning Lab</h1>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full border border-green-200">
            v2.1 (Live)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>Welcome, {teacherName}</span>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
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
