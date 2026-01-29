
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GradeSelectorProps {
  selectedGrades: number[];
  onChange: (grades: number[]) => void;
  subject?: "math" | "english" | "ict";
  availableGrades?: number[]; // Added this prop
}

const GradeSelector: React.FC<GradeSelectorProps> = ({
  selectedGrades,
  onChange,
  subject = "math",
  availableGrades = [3, 4, 5, 6, 7, 8, 9, 10] // Default if not provided
}) => {
  const grades = availableGrades;

  const handleGradeChange = (grade: number) => {
    if (selectedGrades.includes(grade)) {
      onChange(selectedGrades.filter(g => g !== grade));
    } else {
      onChange([...selectedGrades, grade]);
    }
  };

  // Get color based on subject
  const getSubjectColor = (isSelected: boolean) => {
    if (!isSelected) return "border-border hover:border-focus-blue/50 bg-bg-card text-text-secondary";

    switch (subject) {
      case "math": return "border-math-purple bg-math-purple/10 text-math-purple font-bold shadow-sm";
      case "english": return "border-english-green bg-english-green/10 text-english-green font-bold shadow-sm";
      case "ict": return "border-ict-orange bg-ict-orange/10 text-ict-orange font-bold shadow-sm";
      default: return "border-focus-blue bg-focus-blue/10 text-focus-blue font-bold shadow-sm";
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Target Grades</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {grades.map(grade => (
          <div
            key={grade}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200
              ${getSubjectColor(selectedGrades.includes(grade))}
            `}
            onClick={() => handleGradeChange(grade)}
          >
            <div className={`
              w-4 h-4 rounded border flex items-center justify-center transition-colors
              ${selectedGrades.includes(grade)
                ? (subject === 'math' ? 'bg-math-purple border-math-purple' : subject === 'english' ? 'bg-english-green border-english-green' : 'bg-ict-orange border-ict-orange')
                : 'bg-white border-gray-300'}
            `}>
              {selectedGrades.includes(grade) && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className="text-sm select-none">Grade {grade}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeSelector;
