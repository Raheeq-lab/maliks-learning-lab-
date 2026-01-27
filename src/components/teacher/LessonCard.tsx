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
    onCopy: () => void;
    onEdit: () => void;
    onDelete: () => void;
    subject?: "math" | "english" | "ict";
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
    subject = "math"
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
        <Card className={`border-l-4 ${getSubjectColor()} shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold leading-tight">
                            Lesson: {title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Grade {gradeLevel}</p>
                    </div>
                    <Badge variant={isPublic ? "secondary" : "outline"} className={isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {isPublic ? (
                            <><Globe size={10} className="mr-1" /> Public</>
                        ) : (
                            <><Lock size={10} className="mr-1" /> Private</>
                        )}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">


                {!isPublic && (
                    <div className="text-center">
                        <p className="text-xs text-gray-400 italic">Private Dashboard Only</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-0">
                <Button onClick={onRun} className="w-full bg-black text-white hover:bg-gray-800">
                    <Play size={16} className="mr-2" /> Open Lesson
                </Button>

                <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Edit size={14} className="mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                        <Copy size={14} className="mr-1" /> {copied ? "Copied" : "Code"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
                        <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default LessonCard;
