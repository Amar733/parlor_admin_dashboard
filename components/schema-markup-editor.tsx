"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Code } from "lucide-react";

interface SchemaMarkupEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
}

export function SchemaMarkupEditor({
  value,
  onChange,
  onValidationChange,
  label = "Schema Markup (JSON-LD)",
  placeholder = '{"@context": "https://schema.org", "@type": "Organization", "name": "Your Business"}',
}: SchemaMarkupEditorProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    validateSchema(value);
  }, [value]);

  const validateSchema = (schema: string) => {
    if (!schema.trim()) {
      setIsValid(null);
      setError("");
      onValidationChange?.(true);
      return;
    }

    try {
      const parsed = JSON.parse(schema);
      
      if (!parsed["@context"]) {
        setIsValid(false);
        setError("Missing @context property");
        onValidationChange?.(false);
        return;
      }
      
      if (!parsed["@type"]) {
        setIsValid(false);
        setError("Missing @type property");
        onValidationChange?.(false);
        return;
      }

      setIsValid(true);
      setError("");
      onValidationChange?.(true);
    } catch (e) {
      setIsValid(false);
      setError(e instanceof Error ? e.message : "Invalid JSON format");
      onValidationChange?.(false);
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch (e) {
      // Keep original if formatting fails
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
    } catch (e) {
      // Keep original if minifying fails
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatJSON}
            disabled={!value.trim()}
          >
            <Code className="h-4 w-4 mr-1" /> Format
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={minifyJSON}
            disabled={!value.trim()}
          >
            Minify
          </Button>
        </div>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="font-mono text-xs"
      />

      {isValid === true && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Valid schema markup
          </AlertDescription>
        </Alert>
      )}

      {isValid === false && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Add structured data in JSON-LD format. Must include @context and @type properties.
      </p>
    </div>
  );
}
