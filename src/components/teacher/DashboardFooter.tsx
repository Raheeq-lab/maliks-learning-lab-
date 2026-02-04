
import React from 'react';

const DashboardFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-quiz-dark text-white/80 py-6 mt-auto border-t border-white/10 font-poppins">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {currentYear} Malik's Learning Lab. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default DashboardFooter;
