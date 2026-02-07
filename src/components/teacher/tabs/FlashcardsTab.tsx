import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Layers, Copy, Edit, Trash2, Globe, Lock, ArrowLeft, ArrowRight, RotateCcw, Play } from "lucide-react";
import { FlashcardSet } from "@/types/quiz";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

import FlashcardModal from '@/components/teacher/FlashcardModal';
import { Sparkles } from 'lucide-react';

interface FlashcardsTabProps {
    flashcardSets: FlashcardSet[];
    onCreateSet: (set: FlashcardSet) => void;
    onUpdateSet: (set: FlashcardSet) => void;
    onGenerateSet: () => void;
    onCopyCode: (code: string) => void;
    onDeleteSet: (id: string) => void;
    onTogglePublic: (id: string, isPublic: boolean) => void;
    subject: "math" | "english" | "ict";
    isLoading: boolean;
}

const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
    flashcardSets,
    onCreateSet,
    onUpdateSet,
    onGenerateSet,
    onCopyCode,
    onDeleteSet,
    onTogglePublic,
    subject,
    isLoading
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);

    // Viewer State
    const [viewingSet, setViewingSet] = useState<FlashcardSet | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Reset viewer state when opening a new set
    const handleOpenSet = (set: FlashcardSet) => {
        setViewingSet(set);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const handleOpenCreateModal = () => {
        setEditingSet(null);
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (set: FlashcardSet) => {
        setEditingSet(set);
        setIsEditModalOpen(true);
    };

    const handleSaveSet = async (set: FlashcardSet) => {
        if (editingSet) {
            await onUpdateSet(set);
        } else {
            await onCreateSet(set);
        }
        setIsEditModalOpen(false);
        setEditingSet(null);
    };

    const handleNextCard = () => {
        if (!viewingSet) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev + 1) % viewingSet.cards.length);
        }, 150); // Small delay for flip reset visual
    };

    const handlePrevCard = () => {
        if (!viewingSet) return;
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentCardIndex((prev) => (prev - 1 + viewingSet.cards.length) % viewingSet.cards.length);
        }, 150);
    };

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
            case "math": return "border-l-purple-500 hover:shadow-purple-100 dark:hover:shadow-purple-900/20";
            case "english": return "border-l-green-500 hover:shadow-green-100 dark:hover:shadow-green-900/20";
            case "ict": return "border-l-orange-500 hover:shadow-orange-100 dark:hover:shadow-orange-900/20";
            default: return "border-l-purple-500";
        }
    };

    const getSubjectGradient = () => {
        switch (subject) {
            case "math": return "from-purple-600 to-indigo-600";
            case "english": return "from-green-600 to-emerald-600";
            case "ict": return "from-orange-500 to-red-600";
            default: return "from-purple-600 to-indigo-600";
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
                <div className="flex gap-3 w-full md:w-auto">
                    {/* Manual Create Button */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            onClick={handleOpenCreateModal}
                            className="flex-1 md:flex-none bg-bg-card hover:bg-math-purple/10 text-text-primary border border-border/50 font-bold shadow-sm px-5 py-6 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                        >
                            <Plus size={20} className="text-math-purple" /> Manual Create
                        </Button>
                        <Button
                            onClick={onGenerateSet}
                            className="flex-1 md:flex-none bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/20 px-6 py-6 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
                        >
                            <Sparkles size={20} /> AI Generator
                        </Button>
                    </div>

                    {/* AI Generator Button - Optional/Or logic */}
                    {/* We can decide if we want this button here or just let them go to the Generate tab manually. 
                        Given user request for manual, let's keep manual prominent. */}
                </div>
            </div>

            {/* Flashcard Modal */}
            <FlashcardModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveSet}
                initialData={editingSet}
                subject={subject}
            />

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
                                <Button
                                    className={`w-full font-bold shadow-md hover:scale-[1.02] transition-all bg-gradient-to-r ${getSubjectGradient()} text-white border-0`}
                                    onClick={() => handleOpenSet(set)}
                                >
                                    <Play size={16} className="mr-2 fill-current" /> Open Flashcards
                                </Button>

                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 h-9 text-xs border-dashed border-border transition-all dark:bg-bg-elevated dark:hover:bg-bg-elevated/80 ${copiedId === set.id ? 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20' : 'text-text-tertiary hover:bg-bg-secondary dark:text-text-secondary'}`}
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
                                        className="flex-1 h-9 text-xs border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary dark:bg-bg-elevated dark:hover:bg-bg-elevated/80 dark:border-border dark:text-text-secondary"
                                        onClick={() => handleOpenEditModal(set)}
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

            {/* Flashcard Player Dialog */}
            <Dialog open={!!viewingSet} onOpenChange={(open) => !open && setViewingSet(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-bg-page border-border overflow-hidden">
                    {viewingSet && (
                        <>
                            <DialogHeader className="p-6 pb-2 border-b border-border bg-bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                            {viewingSet.title}
                                            <Badge variant="outline" className="text-sm font-normal">
                                                {currentCardIndex + 1} / {viewingSet.cards.length}
                                            </Badge>
                                        </DialogTitle>
                                        <DialogDescription className="mt-1">
                                            Click the card to flip. Use arrows to navigate.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 flex items-center justify-center p-8 bg-bg-secondary/30 relative overflow-hidden">
                                {/* Navigation Buttons (Desktop) */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-bg-card shadow-lg hover:bg-bg-hover hidden md:flex z-10"
                                    onClick={(e) => { e.stopPropagation(); handlePrevCard(); }}
                                >
                                    <ArrowLeft size={24} />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-bg-card shadow-lg hover:bg-bg-hover hidden md:flex z-10"
                                    onClick={(e) => { e.stopPropagation(); handleNextCard(); }}
                                >
                                    <ArrowRight size={24} />
                                </Button>

                                {/* The Card */}
                                <div
                                    className="relative w-full max-w-2xl aspect-[3/2] perspective-1000 cursor-pointer group"
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                                        {/* Front */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden">
                                            <Card className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-bg-card border-2 border-math-purple/20 shadow-xl rounded-3xl hover:border-math-purple/40 transition-colors">
                                                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Front</span>
                                                <h3 className="text-3xl md:text-4xl font-bold text-text-primary select-none">
                                                    {viewingSet.cards[currentCardIndex].front}
                                                </h3>
                                                <div className="absolute bottom-6 text-text-tertiary text-sm flex items-center gap-2 opacity-60">
                                                    <RotateCcw size={14} /> Click to flip
                                                </div>
                                            </Card>
                                        </div>

                                        {/* Back */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                                            <Card className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-math-purple to-purple-800 text-white border-none shadow-xl rounded-3xl">
                                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Back</span>
                                                <h3 className="text-3xl md:text-4xl font-bold select-none">
                                                    {viewingSet.cards[currentCardIndex].back}
                                                </h3>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Controls / Footer */}
                            <div className="p-4 border-t border-border bg-bg-card flex justify-center gap-4 md:hidden">
                                <Button variant="outline" onClick={handlePrevCard} className="flex-1">
                                    <ArrowLeft size={16} className="mr-2" /> Previous
                                </Button>
                                <Button onClick={() => setIsFlipped(!isFlipped)} className="flex-1">
                                    Flip
                                </Button>
                                <Button variant="outline" onClick={handleNextCard} className="flex-1">
                                    Next <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 bg-bg-secondary w-full">
                                <div
                                    className="h-full bg-math-purple transition-all duration-300"
                                    style={{ width: `${((currentCardIndex + 1) / viewingSet.cards.length) * 100}%` }}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FlashcardsTab;
