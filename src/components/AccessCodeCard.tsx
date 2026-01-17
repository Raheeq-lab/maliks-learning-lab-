import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Trash2 } from "lucide-react";

interface AccessCodeCardProps {
  title: string;
  accessCode: string;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  subject?: "math" | "english" | "ict";
}

const AccessCodeCard: React.FC<AccessCodeCardProps> = ({ title, accessCode, onCopy, onEdit, onDelete, subject = "math" }) => {
  const [copied, setCopied] = useState(false);

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
      case "math": return "border-l-purple-500 bg-gradient-to-br from-white to-purple-50";
      case "english": return "border-l-green-500 bg-gradient-to-br from-white to-green-50";
      case "ict": return "border-l-orange-500 bg-gradient-to-br from-white to-orange-50";
      default: return "border-l-purple-500 bg-gradient-to-br from-white to-purple-50";
    }
  };

  // Get icon color based on subject
  const getIconColor = () => {
    switch (subject) {
      case "math": return "text-purple-500";
      case "english": return "text-green-500";
      case "ict": return "text-orange-500";
      default: return "text-purple-500";
    }
  };

  return (
    <Card className={`border-l-4 ${getSubjectColor()} shadow-sm hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Access Code</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 border border-gray-300 rounded-md font-mono text-xl tracking-wider px-4 py-2">
            {accessCode ? accessCode.toUpperCase() : '------'}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0 w-full">
        <div className="flex gap-2 w-full">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={onEdit}
            >
              <Edit size={16} />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 gap-2 ${getIconColor()}`}
            onClick={handleCopy}
            disabled={!accessCode}
          >
            <Copy size={16} />
            {copied ? "Copied!" : "Code"}
          </Button>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AccessCodeCard;
