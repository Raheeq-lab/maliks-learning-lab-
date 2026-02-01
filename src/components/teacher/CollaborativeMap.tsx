
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Users, MessageSquare, StickyNote, Plus, Move, Edit3, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CollaborativeMapProps {
    topic: string;
    onComplete?: () => void;
}

interface MapNode {
    id: string;
    type: 'idea' | 'connection' | 'example' | 'question';
    text: string;
    x: number;
    y: number;
    connections: string[]; // IDs of connected nodes
}

export const CollaborativeMap: React.FC<CollaborativeMapProps> = ({ topic, onComplete }) => {
    const [step, setStep] = useState(0);
    const [timeLeft, setTimeLeft] = useState(12 * 60); // 12 minutes
    const [isRunning, setIsRunning] = useState(false);
    const [nodes, setNodes] = useState<MapNode[]>([]);
    const [activeNode, setActiveNode] = useState<string | null>(null);

    // Initial center node
    useEffect(() => {
        if (nodes.length === 0) {
            setNodes([{
                id: 'center',
                type: 'idea',
                text: topic,
                x: 50,
                y: 50, // Percentages
                connections: []
            }]);
        }
    }, [topic]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getPhaseTitle = () => {
        if (timeLeft > 9 * 60) return { title: "Phase 1: Key Ideas", color: "text-blue-500", bg: "bg-blue-100" };
        if (timeLeft > 5 * 60) return { title: "Phase 2: Connections", color: "text-purple-500", bg: "bg-purple-100" };
        if (timeLeft > 1 * 60) return { title: "Phase 3: Examples", color: "text-green-500", bg: "bg-green-100" };
        return { title: "Phase 4: Questions", color: "text-orange-500", bg: "bg-orange-100" };
    };

    const phase = getPhaseTitle();

    const addNode = (type: MapNode['type']) => {
        const id = crypto.randomUUID();
        const offset = Math.random() * 20 - 10;
        setNodes(prev => [...prev, {
            id,
            type,
            text: type === 'question' ? '?' : 'New Node',
            x: 50 + offset,
            y: 50 + offset,
            connections: ['center']
        }]);
    };

    const updateNodePos = (id: string, dx: number, dy: number) => {
        setNodes(prev => prev.map(n =>
            n.id === id ? { ...n, x: Math.max(0, Math.min(100, n.x + dx)), y: Math.max(0, Math.min(100, n.y + dy)) } : n
        ));
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${phase.bg} ${phase.color}`}>
                        <Timer size={16} />
                        {phase.title}
                    </div>
                    <div className="text-2xl font-mono font-bold text-slate-700">
                        {formatTime(timeLeft)}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsRunning(!isRunning)} variant={isRunning ? "secondary" : "default"}>
                        {isRunning ? "Pause" : "Start Collaboration"}
                    </Button>
                </div>
            </div>

            {/* Whiteboard Area */}
            <div className="relative h-[500px] bg-slate-50 overflow-hidden cursor-crosshair">
                <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-10 pointer-events-none">
                    {/* Grid lines could go here */}
                </div>

                {/* Nodes */}
                {nodes.map(node => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute p-4 rounded-lg shadow-md cursor-grab active:cursor-grabbing min-w-[120px] text-center
                            ${node.id === 'center' ? 'bg-[#45B7D1] text-white font-bold text-lg z-20' : 'bg-white border-2 hover:border-[#45B7D1]'}
                            ${node.type === 'question' ? 'border-orange-400 bg-orange-50' : ''}
                        `}
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                        drag
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            // Simple percent conversion approximation
                            updateNodePos(node.id, info.offset.x / 5, info.offset.y / 5);
                        }}
                    >
                        {node.type === 'question' && <MessageSquare size={16} className="text-orange-500 mx-auto mb-1" />}
                        <div contentEditable suppressContentEditableWarning className="outline-none empty:before:content-['Type...']">
                            {node.text}
                        </div>
                    </motion.div>
                ))}

                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white p-2 rounded-full shadow-lg border border-slate-200">
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => addNode('idea')}>
                        <Plus size={16} className="mr-1" /> Idea
                    </Button>
                    <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => addNode('example')}>
                        <Plus size={16} className="mr-1" /> Example
                    </Button>
                    <Button size="sm" variant="ghost" className="text-orange-600 hover:bg-orange-50" onClick={() => addNode('question')}>
                        <Plus size={16} className="mr-1" /> Question
                    </Button>
                </div>
            </div>

            <div className="p-3 bg-blue-50 text-blue-700 text-xs text-center border-t border-blue-100">
                Teacher Mode: Project this screen on the smartboard. Students collaborate verbally while you or a scribe updates the map.
            </div>
        </div>
    );
};
