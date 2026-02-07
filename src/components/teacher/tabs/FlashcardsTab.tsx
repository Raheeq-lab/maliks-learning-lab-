import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Layers, Copy, Edit, Trash2, Globe, Lock } from "lucide-react";
import { FlashcardSet } from "@/types/quiz";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface FlashcardsTabProps {
    flashcardSets: FlashcardSet[];
    onCreateSet: () => void;
    onCopyCode: (code: string) => void;
    onEditSet: (set: FlashcardSet) => void;
    onDeleteSet: (id: string) => void;
    onTogglePublic: (id: string, isPublic: boolean) => void;
    subject: "math" | "english" | "ict";
    isLoading: boolean;
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
    flashcardSets,
    onCreateSet,
    onCopyCode,
    onEditSet,
    onDeleteSet,
    onTogglePublic,
    subject,
    isLoading
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const filteredSets = flashcardSets.filter(set =>
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopy = (code: string, id: string) => {
        onCopyCode(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-math-purple transition-colors" size={18} />
                    <Input
                        placeholder="Search flashcards..."
                        className="pl-10 bg-bg-card border-border border-2 focus:border-math-purple/50 focus:ring-math-purple/20 transition-all rounded-xl h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    onClick={onCreateSet}
                    className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/20 px-6 py-6 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                    <Plus size={20} /> Create New Set
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-border bg-bg-card overflow-hidden">
                            <CardHeader className="pb-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredSets.length === 0 ? (
                <Card className="border-dashed border-2 border-border bg-bg-secondary/30 p-12 text-center rounded-3xl">
                    <div className="mx-auto w-20 h-20 bg-bg-card rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Layers size={40} className="text-text-tertiary" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">No flashcards found</h3>
                    <p className="text-text-secondary max-w-xs mx-auto mb-6">
                        {searchQuery ? "Try a different search term or clear the filter." : "Start by creating your first set of interactive flashcards!"}
                    </p>
                    {searchQuery && (
                        <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl border-border">
                            Clear Search
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSets.map((set) => (
                        <Card key={set.id} className={`border-l-4 ${getSubjectColor()} shadow-sm hover:shadow-md transition-all bg-bg-card border-border overflow-hidden flex flex-col`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-bold truncate text-text-primary pr-2">
                                            {set.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-5 bg-bg-secondary border-border text-text-secondary">
                                                Grade {set.gradeLevel}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] h-5 bg-orange-500/10 border-orange-500/20 text-orange-600 font-bold">
                                                {set.cards.length} Cards
                                            </Badge>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={set.isPublic ? "secondary" : "outline"}
                                        className={`cursor-pointer transition-colors text-[10px] px-1.5 h-5 flex items-center gap-1 ${set.isPublic ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200" : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTogglePublic(set.id, !set.isPublic);
                                        }}
                                    >
                                        {set.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                                        {set.isPublic ? "Public" : "Private"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-text-secondary line-clamp-2 italic mb-4">
                                    {set.description || "No description provided."}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0 flex flex-col gap-2">
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 h-9 text-xs border-dashed border-border transition-all ${copiedId === set.id ? 'text-green-600 bg-green-50 border-green-200' : 'text-text-tertiary hover:bg-bg-secondary'}`}
                                        onClick={() => handleCopy(set.accessCode, set.id)}
                                    >
                                        {copiedId === set.id ? (
                                            <span className="font-bold">Copied!</span>
                                        ) : (
                                            <><Copy size={14} className="mr-1.5" /> {set.accessCode}</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 text-xs border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                                        onClick={() => onEditSet(set)}
                                    >
                                        <Edit size={14} className="mr-1.5" /> Edit
                                    </Button>
                                    {deleteConfirmId === set.id ? (
                                        <div className="flex-1 flex gap-1">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="flex-1 h-9 text-[10px] font-bold"
                                                onClick={() => { onDeleteSet(set.id); setDeleteConfirmId(null); }}
                                            >
                                                Confirm
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-2 text-[10px]"
                                                onClick={() => setDeleteConfirmId(null)}
                                            >
                                                X
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-3 border-border text-error-coral hover:bg-error-coral hover:text-white transition-all shadow-sm hover:shadow-error-coral/20"
                                            onClick={() => setDeleteConfirmId(set.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FlashcardsTab;
