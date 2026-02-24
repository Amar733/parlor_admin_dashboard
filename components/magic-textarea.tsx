"use client";

import * as React from 'react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface MagicTextareaProps extends TextareaProps {
  value: string;
  onValueChange: (newValue: string) => void;
  aiContext: string;
}

export function MagicTextarea({
  value,
  onValueChange,
  aiContext,
  className,
  ...props
}: MagicTextareaProps) {
  const [isImproving, setIsImproving] = React.useState(false);
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const handleImproveText = async () => {
    if (!value || value.trim().length < 10) {
        toast({
            variant: "destructive",
            title: "Not enough text",
            description: "Please provide at least 10 characters to improve.",
        });
        return;
    }
    
    setIsImproving(true);
    try {
      const response = await authFetch('/api/actions/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, context: aiContext }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to improve text.');
      }
      const { improvedText } = await response.json();
      onValueChange(improvedText);
      toast({ title: "Text Improved", description: "The content has been enhanced by AI." });
    } catch (error) {
       toast({ variant: "destructive", title: "AI Enhancement Failed", description: (error as Error).message });
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="relative w-full">
      <Textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn("pr-12", className)}
        {...props}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
             <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleImproveText}
                disabled={isImproving || !value}
                className="absolute bottom-2 right-2 h-8 w-8 text-muted-foreground hover:text-primary"
              >
                {isImproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Wand2 className="h-4 w-4" />
                )}
                <span className="sr-only">Improve with AI</span>
              </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Improve with AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
