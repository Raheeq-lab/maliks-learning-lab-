
import React from 'react';
import { Button } from "@/components/ui/button";
import AccessCodeCard from '@/components/AccessCodeCard';
import { Quiz } from '@/types/quiz';
import { Book, BookOpen, BookText, Laptop, ArrowLeft } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface QuizzesTabProps {
  quizzes: Quiz[];
  onCreateQuiz: () => void;
  onCopyCode: (quizTitle: string) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onTogglePublic?: (quiz: Quiz) => void;
  subject?: "math" | "english" | "ict";
}

const QuizzesTab: React.FC<QuizzesTabProps> = ({ quizzes, onCreateQuiz, onCopyCode, onEditQuiz, onDeleteQuiz, onTogglePublic, subject = "math" }) => {
  const [filterGrade, setFilterGrade] = React.useState<string>("all");

  const getSubjectIcon = () => {
    switch (subject) {
      case "math": return <BookOpen size={20} className="text-math-purple" />;
      case "english": return <BookText size={20} className="text-english-green" />;
      case "ict": return <Laptop size={20} className="text-ict-orange" />;
      default: return <BookOpen size={20} className="text-math-purple" />;
    }
  };

  const getSubjectColor = () => {
    switch (subject) {
      case "math": return "bg-math-purple hover:bg-math-purple/90 shadow-purple-200";
      case "english": return "bg-english-green hover:bg-english-green/90 shadow-green-200";
      case "ict": return "bg-ict-orange hover:bg-ict-orange/90 shadow-orange-200";
      default: return "bg-focus-blue hover:bg-focus-blue-dark shadow-blue-200";
    }
  };

  const filteredQuizzes = filterGrade === "all"
    ? quizzes
    : quizzes.filter(q => q.gradeLevel === parseInt(filterGrade) || (q as any).grade_level === parseInt(filterGrade));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-text-primary">
            <div className={`p-2 rounded-lg bg-bg-secondary ${subject === 'math' ? 'text-math-purple' : subject === 'english' ? 'text-english-green' : 'text-ict-orange'
              }`}>
              {getSubjectIcon()}
            </div>
            <span>My {subject.charAt(0).toUpperCase() + subject.slice(1)} Quizzes</span>
          </h2>
          <p className="text-text-secondary ml-[3.25rem] text-sm">Manage and organize your class assessments</p>
        </div>
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
            onClick={onCreateQuiz}
            className={`text-white transition-all transform hover:scale-105 shadow-lg ${getSubjectColor()}`}
          >
            Create New Quiz
          </Button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center">
          <div className={`p-4 rounded-full bg-bg-secondary mb-4 ${subject === 'math' ? 'text-math-purple' : subject === 'english' ? 'text-english-green' : 'text-ict-orange'
            }`}>
            <Book size={48} />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No Quizzes Found</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-8">
            {filterGrade !== "all"
              ? `You don't have any Grade ${filterGrade} quizzes yet.`
              : `You haven't created any ${subject} quizzes. Start by creating your first interactive quiz for your students!`}
          </p>
          <Button
            onClick={onCreateQuiz}
            size="lg"
            className={`text-white rounded-full px-8 py-6 text-lg ${getSubjectColor()}`}
          >
            Create First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-card-gap">
          {filteredQuizzes.map(quiz => (
            <AccessCodeCard
              key={quiz.id}
              title={`${quiz.title} (Grade ${quiz.gradeLevel})`}
              accessCode={quiz.accessCode}
              isPublic={quiz.isPublic || (quiz as any).is_public}
              onCopy={() => onCopyCode(quiz.title)}
              onEdit={() => onEditQuiz(quiz)}
              onDelete={() => onDeleteQuiz(quiz.id)}
              onTogglePublic={() => onTogglePublic && onTogglePublic(quiz)}
              subject={quiz.subject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizzesTab;
