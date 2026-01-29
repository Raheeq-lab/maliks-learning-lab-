
import React from 'react';
import { Button } from "@/components/ui/button";
import LessonCard from '@/components/teacher/LessonCard';
import { Lesson } from '@/types/quiz';
import { FileText, BookOpen, Laptop, BookText } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LessonsTabProps {
  lessons: Lesson[];
  onCreateLesson: () => void;
  onCopyCode: (lessonTitle: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onTogglePublic?: (lesson: Lesson) => void;
  onRunLesson: (lessonId: string) => void;
  subject: "math" | "english" | "ict";
}

const LessonsTab: React.FC<LessonsTabProps> = ({ lessons, onCreateLesson, onCopyCode, onEditLesson, onDeleteLesson, onTogglePublic, onRunLesson, subject }) => {
  const [filterGrade, setFilterGrade] = React.useState<string>("all");

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen size={18} className="text-purple-500" />;
      case "english": return <BookText size={18} className="text-green-500" />;
      case "ict": return <Laptop size={18} className="text-orange-500" />;
      default: return <BookOpen size={18} className="text-purple-500" />;
    }
  };

  const getSubjectColor = () => {
    switch (subject) {
      case "math": return "bg-purple-600 hover:bg-purple-700";
      case "english": return "bg-green-600 hover:bg-green-700";
      case "ict": return "bg-orange-600 hover:bg-orange-700";
      default: return "bg-purple-600 hover:bg-purple-700";
    }
  };

  const filteredLessons = filterGrade === "all"
    ? lessons
    : lessons.filter(l => (l.gradeLevel || (l as any).grade_level) === parseInt(filterGrade));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {getSubjectIcon()}
          <span>My {subject.charAt(0).toUpperCase() + subject.slice(1)} Lessons</span>
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-[180px]">
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="bg-bg-input border-border">
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[...Array(11)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>Grade {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={onCreateLesson}
            className={`text-white ${getSubjectColor()}`}
          >
            <FileText size={16} className="mr-2" />
            Create New Lesson
          </Button>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-lg border border-border">
          <FileText size={48} className="mx-auto mb-4 text-text-tertiary" />
          <p className="text-text-secondary">
            {filterGrade !== "all"
              ? `You don't have any Grade ${filterGrade} lessons yet.`
              : `You haven't created any lessons for this subject yet.`}
          </p>
          <p className="text-text-secondary mb-4">Get started by creating your first interactive lesson!</p>
          <Button
            onClick={onCreateLesson}
            className={`text-white ${getSubjectColor()}`}
          >
            Create New Lesson
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-card-gap">
          {filteredLessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              gradeLevel={lesson.gradeLevel}
              accessCode={lesson.accessCode}
              isPublic={lesson.isPublic || (lesson as any).is_public}
              onRun={() => onRunLesson(lesson.id)}
              onCopy={() => onCopyCode(lesson.title)}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson.id)}
              onTogglePublic={() => onTogglePublic && onTogglePublic(lesson)}
              subject={lesson.subject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonsTab;
