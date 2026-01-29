
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BookOpen, BookText, Laptop } from "lucide-react";

interface SubjectSelectorProps {
  selectedSubject: string;
  onChange: (subject: string) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ selectedSubject, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="bg-bg-card p-1.5 rounded-xl border border-border inline-flex shadow-sm">
        <ToggleGroup
          type="single"
          value={selectedSubject}
          onValueChange={(value) => {
            if (value) onChange(value);
          }}
          className="justify-start gap-1"
        >
          <ToggleGroupItem
            value="math"
            aria-label="Mathematics"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=on]:bg-math-purple data-[state=on]:text-white hover:bg-bg-hover transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Mathematics</span>
          </ToggleGroupItem>

          <ToggleGroupItem
            value="english"
            aria-label="English"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=on]:bg-english-green data-[state=on]:text-white hover:bg-bg-hover transition-all"
          >
            <BookText className="w-4 h-4" />
            <span className="font-medium">English</span>
          </ToggleGroupItem>

          <ToggleGroupItem
            value="ict"
            aria-label="ICT"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=on]:bg-ict-orange data-[state=on]:text-white hover:bg-bg-hover transition-all"
          >
            <Laptop className="w-4 h-4" />
            <span className="font-medium">ICT</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default SubjectSelector;
