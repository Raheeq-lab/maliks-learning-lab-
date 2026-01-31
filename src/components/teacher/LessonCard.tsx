import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2, Lock, Play, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LessonCardProps {
    title: string;
    gradeLevel: number;
    accessCode: string;
    isPublic?: boolean;
    onRun: () => void;
    onTogglePublic: () => void;
    onCopy: () => void;
    onEdit: () => void;
    onDelete: () => void;
    subject?: "math" | "english" | "ict";
    researchNotes?: {
        misconceptions?: string[];
        strategies?: string[];
    };
}

const LessonCard: React.FC<LessonCardProps> = ({
    title,
    gradeLevel,
    accessCode,
    isPublic = false,
    onRun,
    onCopy,
    onEdit,
    onDelete,
    onTogglePublic,
    subject = "math",
    researchNotes
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (accessCode?.trim()) {
            navigator.clipboard.writeText(accessCode.trim().toUpperCase());
            setCopied(true);
            onCopy();
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getSubjectColor = () => {
        switch (subject) {
            case "math": return "border-l-purple-500 hover:shadow-purple-100";
            case "english": return "border-l-green-500 hover:shadow-green-100";
            case "ict": return "border-l-orange-500 hover:shadow-orange-100";
            default: return "border-l-purple-500";
        }
    };

    return (
        <Card className={`border-l-4 ${getSubjectColor()} shadow-sm hover:shadow-md transition-all bg-bg-card border-border`}>
            <CardHeader className="pb-2 p-card-padding">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold leading-tight text-text-primary tracking-tight">
                            {title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-text-secondary font-medium">Grade {gradeLevel}</p>
                            {researchNotes && (researchNotes.misconceptions?.length > 0 || researchNotes.strategies?.length > 0) && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-math-purple/5 border-math-purple/30 text-math-purple font-bold uppercase tracking-tight">
                                    Research-Based
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Badge
                        variant={isPublic ? "secondary" : "outline"}
                        className={`cursor-pointer transition-colors text-[10px] px-1.5 h-5 ${isPublic ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200" : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePublic();
                        }}
                    >
                        {isPublic ? (
                            <><Globe size={10} className="mr-1" /> Public</>
                        ) : (
                            <><Lock size={10} className="mr-1" /> Private</>
                        )}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 p-card-padding pt-0 pb-3">
                {!isPublic && (
                    <div className="text-center">
                        <p className="text-[10px] text-text-tertiary italic">Private Dashboard Only</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 p-card-padding pt-0 w-full">
                <Button onClick={(e) => { e.stopPropagation(); onRun(); }} className="w-full h-9 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                    <Play size={14} className="mr-2" /> Open Lesson
                </Button>

                <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit size={12} className="mr-1" /> Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 h-8 text-xs ${isPublic ? 'text-green-600 dark:text-green-400' : 'text-text-secondary'} hover:bg-bg-secondary`}
                        onClick={(e) => { e.stopPropagation(); onTogglePublic(); }}
                    >
                        {isPublic ? <Globe size={12} className="mr-1" /> : <Lock size={12} className="mr-1" />}
                        {isPublic ? 'Public' : 'Private'}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs border-border text-error-coral hover:text-white hover:bg-error-coral" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Trash2 size={12} className="mr-1" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default LessonCard;
