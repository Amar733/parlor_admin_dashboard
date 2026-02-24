"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Clock, Wrench } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ 
  title = "Coming Soon", 
  description = "This feature is currently under development and will be available soon." 
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Construction className="h-16 w-16 text-primary" />
              <Clock className="h-6 w-6 text-muted-foreground absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{description}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>We're working hard to bring this to you!</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}