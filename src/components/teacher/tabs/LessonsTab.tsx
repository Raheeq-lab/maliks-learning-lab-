
import React from 'react';
import { Button } from "@/components/ui/button";
import LessonCard from '@/components/teacher/LessonCard';
import { Lesson } from '@/types/quiz';
import { FileText, BookOpen, Laptop, BookText } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {getSubjectIcon()}
          <span>My {subject.charAt(0).toUpperCase() + subject.slice(1)} Lessons</span>
        </h2>
        <Button
          onClick={onCreateLesson}
          className={`text-white ${getSubjectColor()}`}
        >
          <FileText size={16} className="mr-2" />
          Create New Lesson
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">You haven't created any lessons for this subject yet.</p>
          <p className="text-gray-500 mb-4">Get started by creating your first interactive lesson!</p>
          <Button
            onClick={onCreateLesson}
            className={`text-white ${getSubjectColor()}`}
          >
            Create New Lesson
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(lesson => (
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
