"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface PageContentPreviewProps {
  content: string;
  title?: string;
}

export function PageContentPreview({ content, title = "Content Preview" }: PageContentPreviewProps) {
  // SECURITY: Sanitize all HTML content before rendering to prevent XSS attacks
  const sanitizedContent = content ? sanitizeHtml(content) : '<p class="text-muted-foreground">No content to preview</p>';
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'inherit'
          }}
        />
      </CardContent>
    </Card>
  );
}