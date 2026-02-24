"use client";

import { RichTextEditor } from '@/components/rich-text-editor';

interface TinyMCEEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TinyMCEEditor({ value, onChange, disabled = false, placeholder }: TinyMCEEditorProps) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}