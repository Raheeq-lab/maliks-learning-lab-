import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X, Layers } from 'lucide-react';
import { FlashcardSet } from '@/types/quiz';
import { Card, CardContent } from '@/components/ui/card';

interface FlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (set: FlashcardSet) => Promise<void>;
    initialData?: FlashcardSet | null;
    subject: "math" | "english" | "ict";
    gradeLevel?: number;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    subject,
    gradeLevel = 1
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [cards, setCards] = useState<{ id: string; front: string; back: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form with existing data or defaults
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setDescription(initialData.description || '');
                setCards(initialData.cards.map(c => ({ ...c })));
            } else {
                // Reset for new creation
                setTitle('');
                setDescription('');
                setCards([
                    { id: crypto.randomUUID(), front: '', back: '' },
                    { id: crypto.randomUUID(), front: '', back: '' },
                    { id: crypto.randomUUID(), front: '', back: '' }
                ]);
            }
        }
    }, [isOpen, initialData]);

    const handleAddCard = () => {
        setCards([...cards, { id: crypto.randomUUID(), front: '', back: '' }]);
    };

    const handleDeleteCard = (id: string) => {
        if (cards.length <= 1) return; // Prevent deleting last card
        setCards(cards.filter(c => c.id !== id));
    };

    const handleUpdateCard = (id: string, field: 'front' | 'back', value: string) => {
        setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            const newSet: FlashcardSet = {
                id: initialData?.id || crypto.randomUUID(),
                title,
                description,
                gradeLevel: initialData?.gradeLevel || gradeLevel,
                subject: initialData?.subject || subject,
                cards: cards.filter(c => c.front.trim() || c.back.trim()), // Filter empty cards
                accessCode: initialData?.accessCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
                createdBy: initialData?.createdBy || '',
                createdAt: initialData?.createdAt || new Date().toISOString(),
                isPublic: initialData?.isPublic || false
            };

            await onSave(newSet);
            onClose();
        } catch (error) {
            console.error("Failed to save flashcards", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-bg-page border-border overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-border bg-bg-card flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${subject === 'math' ? 'bg-purple-100 text-purple-600' :
                                subject === 'english' ? 'bg-green-100 text-green-600' :
                                    'bg-orange-100 text-orange-600'
                            }`}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-text-primary">
                                {initialData ? 'Edit Flashcard Set' : 'Create New Flashcard Set'}
                            </DialogTitle>
                            <DialogDescription>
                                {initialData ? 'Update your flashcards below.' : 'Add a title and cards to get started.'}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-text-secondary font-medium">Set Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Algebra Basics"
                                className="bg-bg-input border-border focus:ring-math-purple/20 h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-text-secondary font-medium">Description (Optional)</Label>
                            <Input
                                id="desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief summary of this set..."
                                className="bg-bg-input border-border focus:ring-math-purple/20 h-10"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-secondary/20">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <span className="bg-bg-secondary text-text-secondary px-2 py-0.5 rounded text-xs border border-border">
                                {cards.length} Cards
                            </span>
                        </h3>
                        <Button
                            onClick={handleAddCard}
                            variant="outline"
                            size="sm"
                            className="border-dashed border-border hover:border-math-purple hover:text-math-purple hover:bg-math-purple/5 ml-auto"
                        >
                            <Plus size={16} className="mr-2" /> Add Card
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {cards.map((card, index) => (
                            <Card key={card.id} className="border border-border/60 hover:border-border transition-all shadow-sm group relative overflow-visible">
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="bg-bg-secondary/80 backdrop-blur-sm text-text-secondary text-[10px] font-bold px-2 py-1 rounded-md border border-border/50">
                                        Card {index + 1}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7 text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteCard(card.id)}
                                    disabled={cards.length <= 1}
                                >
                                    <Trash2 size={14} />
                                </Button>

                                <CardContent className="p-0 flex flex-col md:flex-row h-full">
                                    {/* Front Side */}
                                    <div className="flex-1 p-4 border-b md:border-b-0 md:border-r border-border/50 bg-bg-card">
                                        <Label className="text-xs font-bold text-text-tertiary uppercase mb-2 block ml-1">Front (Question)</Label>
                                        <Textarea
                                            value={card.front}
                                            onChange={(e) => handleUpdateCard(card.id, 'front', e.target.value)}
                                            placeholder="Enter term or question..."
                                            className="resize-none min-h-[80px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-lg font-medium placeholder:text-text-tertiary/40"
                                        />
                                    </div>

                                    {/* Back Side */}
                                    <div className="flex-1 p-4 bg-bg-secondary/10">
                                        <Label className="text-xs font-bold text-text-tertiary uppercase mb-2 block ml-1">Back (Answer)</Label>
                                        <Textarea
                                            value={card.back}
                                            onChange={(e) => handleUpdateCard(card.id, 'back', e.target.value)}
                                            placeholder="Enter definition or answer..."
                                            className="resize-none min-h-[80px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base text-text-secondary placeholder:text-text-tertiary/40"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button
                        onClick={handleAddCard}
                        className="w-full py-6 mt-4 border-2 border-dashed border-border bg-transparent text-text-tertiary hover:bg-bg-secondary/50 hover:text-text-primary hover:border-math-purple/50 transition-all rounded-xl"
                    >
                        <Plus size={20} className="mr-2" /> Add Another Card
                    </Button>
                </div>

                <DialogFooter className="p-4 border-t border-border bg-bg-card flex-shrink-0 gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim() || cards.filter(c => c.front.trim() || c.back.trim()).length === 0}
                        className={`min-w-[120px] ${subject === 'math' ? 'bg-math-purple hover:bg-math-purple/90' :
                                subject === 'english' ? 'bg-english-green hover:bg-english-green/90' :
                                    'bg-ict-orange hover:bg-ict-orange/90'
                            } text-white`}
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" /> Save Set
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FlashcardModal;
