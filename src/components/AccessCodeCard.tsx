
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2, Globe, Lock, Radio, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AccessCodeCardProps {
  title: string;
  accessCode: string;
  isPublic?: boolean;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePublic?: () => void;
  onToggleLive?: () => void;
  onStartQuiz?: () => void;
  isLiveSession?: boolean;
  liveStatus?: 'idle' | 'waiting' | 'active';
  subject?: "math" | "english" | "ict";
}

const AccessCodeCard: React.FC<AccessCodeCardProps> = ({
  title,
  accessCode,
  isPublic = false,
  onCopy,
  onEdit,
  onDelete,
  onTogglePublic,
  onToggleLive,
  onStartQuiz,
  isLiveSession = false,
  liveStatus = 'idle',
  subject = "math"
}) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = () => {
    // Ensure we have an access code to copy
    if (accessCode?.trim()) {
      navigator.clipboard.writeText(accessCode.trim().toUpperCase());
      setCopied(true);
      onCopy();

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // Get color based on subject
  const getSubjectColor = () => {
    switch (subject) {
      case "math": return "border-l-math-purple bg-gradient-to-br from-white to-purple-50 dark:from-bg-card dark:to-math-purple/10";
      case "english": return "border-l-english-green bg-gradient-to-br from-white to-green-50 dark:from-bg-card dark:to-english-green/10";
      case "ict": return "border-l-ict-orange bg-gradient-to-br from-white to-orange-50 dark:from-bg-card dark:to-ict-orange/10";
      default: return "border-l-focus-blue bg-gradient-to-br from-white to-purple-50 dark:from-bg-card dark:to-focus-blue/10";
    }
  };

  // Get icon color based on subject
  const getIconColor = () => {
    switch (subject) {
      case "math": return "text-math-purple";
      case "english": return "text-english-green";
      case "ict": return "text-ict-orange";
      default: return "text-focus-blue";
    }
  };

  return (
    <Card className={`border-l-4 ${getSubjectColor()} shadow-sm hover:shadow-md transition-shadow border-t-0 border-b-0 border-r-0`}>
      <CardHeader className="pb-2 p-card-padding">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight text-text-primary tracking-tight font-semibold">{title}</CardTitle>
          <div className="flex flex-col items-end gap-1">
            {isPublic ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 border-none text-[10px] px-1.5 h-5">
                <Globe size={10} className="mr-1" /> Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-text-secondary border-border text-[10px] px-1.5 h-5">
                <Lock size={10} className="mr-1" /> Private
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-text-secondary uppercase tracking-wide font-medium">Access Code</CardDescription>
      </CardHeader>
      <CardContent className="p-card-padding pt-0 pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <div className="bg-bg-code border-2 border-dashed border-border/60 rounded-lg font-mono text-xl tracking-[0.2em] px-6 py-1.5 text-text-primary font-bold w-full text-center">
              {accessCode ? accessCode.toUpperCase() : '------'}
            </div>
          </div>

          {onTogglePublic && (
            <div className="flex items-center justify-between gap-2 px-1">
              <Label htmlFor={`public-mode-${accessCode}`} className="text-xs text-text-secondary cursor-pointer font-normal">
                {isPublic ? "Visible to Everyone" : "Private Dashboard Only"}
              </Label>
              <Switch
                checked={isPublic}
                onCheckedChange={onTogglePublic}
                id={`public-mode-${accessCode}`}
                className="scale-75 origin-right"
              />
            </div>
          )}

          {onToggleLive && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                <Radio size={12} className={isLiveSession ? "text-success-green animate-pulse" : "text-text-tertiary"} />
                <Label htmlFor={`live-mode-${accessCode}`} className="text-xs text-text-secondary cursor-pointer font-normal">
                  Live Session Mode
                </Label>
              </div>
              <Switch
                checked={isLiveSession}
                onCheckedChange={onToggleLive}
                id={`live-mode-${accessCode}`}
                className="scale-75 origin-right"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-card-padding pt-0 w-full">
        <div className="flex gap-2 w-full">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-9 text-xs font-semibold border-border text-text-primary hover:bg-bg-secondary"
              onClick={onEdit}
            >
              <Edit size={14} />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 gap-1.5 h-9 text-xs font-semibold ${getIconColor()} hover:bg-bg-secondary bg-bg-secondary/30`}
            onClick={handleCopy}
            disabled={!accessCode}
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Code"}
          </Button>
        </div>
        {onDelete && (
          <div className="w-full">
            {showDeleteConfirm ? (
              <div className="flex gap-2 w-full animate-in fade-in slide-in-from-right-2 duration-200 py-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 h-8 text-[10px] font-bold"
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowDeleteConfirm(false); }}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-[10px]"
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 h-8 text-xs font-medium text-error-coral hover:text-error-coral-dark hover:bg-error-coral/10 -mt-1"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
        )}

        {isLiveSession && onStartQuiz && (
          <Button
            className={`w-full mt-1 ${liveStatus === 'active' ? 'bg-success-green hover:bg-success-green/90' : 'bg-focus-blue hover:bg-focus-blue-dark'} text-white font-bold h-10 gap-2 shadow-md animate-bounce-subtle`}
            onClick={onStartQuiz}
          >
            {liveStatus === 'active' ? <Globe size={16} /> : <Zap size={16} fill="currentColor" />}
            {liveStatus === 'active' ? 'VIEW LIVE PROGRESS' : 'START LIVE QUIZ'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};


export default AccessCodeCard;
