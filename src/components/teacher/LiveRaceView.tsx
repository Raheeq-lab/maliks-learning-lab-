import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Flag } from "lucide-react";

interface RaceStudent {
    id: string;
    student_name: string;
    current_question: number;
    total_questions: number;
    score: number;
    status: 'in-progress' | 'completed';
}

interface LiveRaceViewProps {
    students: RaceStudent[];
    quizTitle: string;
}

const LiveRaceView: React.FC<LiveRaceViewProps> = ({ students, quizTitle }) => {
    const sortedStudents = [...students].sort((a, b) => {
        // Completed students first, then by progress
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        return b.current_question - a.current_question;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{quizTitle}</h3>
                    <p className="text-text-secondary text-sm">Live progress of active students</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    LIVE
                </div>
            </div>

            <div className="space-y-6 relative py-4">
                {/* The Track Layout */}
                <div className="absolute top-0 bottom-0 right-[5%] w-px bg-dashed border-r border-dashed border-border" title="Finish Line"></div>

                {sortedStudents.length === 0 ? (
                    <div className="text-center py-12 bg-bg-secondary/20 rounded-xl border border-dashed border-border">
                        <p className="text-text-secondary">Waiting for students to join the race...</p>
                    </div>
                ) : (
                    sortedStudents.map((student) => {
                        const progressPercentage = Math.min(100, (student.current_question / student.total_questions) * 100);
                        const isCompleted = student.status === 'completed';

                        return (
                            <div key={student.id} className="relative group">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8 border border-border shadow-sm">
                                            <AvatarFallback className="bg-bg-card font-bold text-xs">
                                                {student.student_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold text-sm text-text-primary truncate max-w-[150px]">
                                            {student.student_name}
                                        </span>
                                        {isCompleted && (
                                            <span className="bg-focus-blue/10 text-focus-blue text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                FINISHED
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className="text-text-tertiary">
                                            Q{student.current_question}/{student.total_questions}
                                        </span>
                                        <span className={`${student.score > (student.total_questions / 2) ? 'text-green-500' : 'text-text-secondary'}`}>
                                            Score: {student.score}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-10 flex items-center">
                                    {/* Track Background */}
                                    <div className="absolute w-full h-2 bg-bg-secondary rounded-full"></div>

                                    {/* Progress Bar */}
                                    <div
                                        className={`absolute h-2 rounded-full transition-all duration-1000 ease-out shadow-sm ${isCompleted ? 'bg-focus-blue' : 'bg-gradient-to-r from-focus-blue-light to-focus-blue'
                                            }`}
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>

                                    {/* The Runner Icon */}
                                    <div
                                        className="absolute transition-all duration-1000 ease-out transform -translate-x-1/2"
                                        style={{ left: `${progressPercentage}%`, zIndex: 10 }}
                                    >
                                        <div className={`p-1.5 rounded-full shadow-lg border-2 border-white ${isCompleted ? 'bg-focus-blue text-white' : 'bg-white text-focus-blue'
                                            } group-hover:scale-110 transition-transform`}>
                                            {isCompleted ? <Zap size={14} fill="currentColor" /> : <Zap size={14} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LiveRaceView;
