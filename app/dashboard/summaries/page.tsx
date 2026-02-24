
"use client";

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, BookText } from 'lucide-react';
import type { Summary } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePermission } from '@/hooks/use-permission';
import { usePathname, useRouter } from 'next/navigation';
import { format as formatDate } from 'date-fns';


export default function SummariesPage() {
    const { user, authFetch, loading: authLoading } = useAuth();
    const { can } = usePermission();
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchSummaries = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await authFetch('/api/summaries');
            if (!response.ok) throw new Error('Failed to fetch summaries');
            const data = await response.json();
            // Always expect an array of summary objects with 'id' and 'userId' as strings
            let summariesArr: Summary[] = [];
            if (Array.isArray(data)) {
                summariesArr = data;
            } else if (Array.isArray(data.summaries)) {
                summariesArr = data.summaries;
            }
            // Defensive: ensure each summary has id and userId as string
            setSummaries(summariesArr.map(s => ({
                ...s,
                _id: typeof s._id === 'string' ? s._id : String(s._id),
                userId: typeof s.userId === 'string' ? s.userId : String(s.userId)
            })));
        } catch (error) {
            if (!(error as Error).message.includes('Session expired')) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, authFetch, toast]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchSummaries();
            }
        }
    }, [authLoading, user, can, pathname, router, fetchSummaries]);

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        try {
            const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
            const response = await authFetch('/api/actions/generate-summary', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: todayStr }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate summary');
            }
            toast({ title: "Success", description: "Today's summary has been generated/updated." });
            // Refetch summaries to show the new one
            await fetchSummaries();
        } catch (error) {
            if (!(error as Error).message.includes('Session expired')) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodaySummary = summaries.some(s => s.date === todayStr && s.userId === user?._id);

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    console.log(summaries,"summaries")
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Wand2 className="h-6 w-6" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
                                    AI Summaries
                                </h1>
                            </div>
                            <p className="text-slate-100 text-lg">
                                AI-powered insights and daily clinic summaries
                            </p>
                        </div>
                        {can('edit', pathname) && (
                            <Button 
                                onClick={handleGenerateSummary} 
                                disabled={isGenerating}
                                variant="secondary" 
                                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 px-6 py-3 text-base"
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                                {hasTodaySummary ? "Regenerate Today" : "Generate Today"}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-slate-400/20 rounded-full blur-3xl"></div>
            </div>

            <Card className="animate-slide-up">
                <CardHeader className="pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                            <BookText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Summary History
                        </CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        {user?.role === 'admin' ? "AI-generated insights from daily clinic operations and activities" : "Your personalized AI-generated daily summaries and insights"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[65vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : summaries.filter(s => typeof s._id === 'string' && s._id.trim() !== '').length > 0 ? (
                            <div className="space-y-8 pr-4">
                                {summaries.filter(s => typeof s._id === 'string' && s._id.trim() !== '').map((summary, index) => (
                                    <div key={summary._id} className="animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                                        <div className="relative overflow-hidden rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                                            <div className="relative p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                                                            <BookText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-xl">
                                                                {new Date(summary.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                            </h3>
                                                            {user?.role === 'admin' && (
                                                                <p className="text-sm text-muted-foreground font-medium">Generated for: {summary.userName}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 bg-primary/20 rounded-full">
                                                        <span className="text-xs font-semibold text-primary">AI Generated</span>
                                                    </div>
                                                </div>
                                                <div className="relative overflow-hidden rounded-xl bg-muted/30 border p-5">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        className="prose prose-sm dark:prose-invert max-w-none"
                                                    >
                                                        {summary.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl">
                                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-6">
                                    <BookText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">
                                    No AI Summaries Yet
                                </h3>
                                <p className="text-muted-foreground text-lg mb-4">
                                    Generate your first AI-powered daily summary to get started
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Wand2 className="h-4 w-4" />
                                    <span>Powered by Advanced AI Analytics</span>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
