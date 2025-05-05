
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuizzes, bulkDeleteQuizzes } from '@/services/api';
import { QuizStatus, Quiz } from '@/types/quiz';
import { QuizCard } from '@/components/QuizCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, PlusCircle, Trash2, Moon, Sun } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const Dashboard = () => {
  const [activeStatus, setActiveStatus] = useState<QuizStatus | 'all'>('all');
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  const { data: quizzes, isLoading, error } = useQuery({
    queryKey: ['quizzes', activeStatus],
    queryFn: () => activeStatus === 'all' ? fetchQuizzes() : fetchQuizzes(activeStatus),
  });

  const deleteQuizzesMutation = useMutation({
    mutationFn: bulkDeleteQuizzes,
    onSuccess: () => {
      toast.success(`${selectedQuizzes.length} quizzes deleted successfully`);
      setSelectedQuizzes([]);
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete quizzes: ${error.message}`);
    }
  });

  const handleTabChange = (value: string) => {
    setActiveStatus(value as QuizStatus | 'all');
    setSelectedQuizzes([]);
    setSelectionMode(false);
  };

  const toggleQuizSelection = (id: string) => {
    if (selectedQuizzes.includes(id)) {
      setSelectedQuizzes(selectedQuizzes.filter(quizId => quizId !== id));
    } else {
      setSelectedQuizzes([...selectedQuizzes, id]);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedQuizzes([]);
    }
  };

  const selectAllQuizzes = () => {
    if (quizzes) {
      const allIds = quizzes.map(quiz => quiz.id);
      setSelectedQuizzes(allIds);
    }
  };

  const deleteSelectedQuizzes = () => {
    if (selectedQuizzes.length === 0) {
      toast.error('No quizzes selected');
      return;
    }
    
    deleteQuizzesMutation.mutate(selectedQuizzes);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage and distribute quizzes with Google Forms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Quiz
            </Button>
          </Link>
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full md:w-fit grid-cols-3 md:grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={QuizStatus.DRAFT}>Draft</TabsTrigger>
            <TabsTrigger value={QuizStatus.APPROVED}>Approved</TabsTrigger>
          </TabsList>
          
          {quizzes && quizzes.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSelectionMode}
                className="gap-2"
              >
                <Checkbox checked={selectionMode} />
                {selectionMode ? 'Cancel Selection' : 'Select Quizzes'}
              </Button>
              
              {selectionMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllQuizzes}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedQuizzes}
                    disabled={selectedQuizzes.length === 0 || deleteQuizzesMutation.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteQuizzesMutation.isPending ? 'Deleting...' : `Delete (${selectedQuizzes.length})`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          {error ? (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load quizzes. Please try again later.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="quiz-card-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border overflow-hidden">
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="quiz-card-grid">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="relative">
                  {selectionMode && (
                    <div className="absolute left-2 top-2 z-10">
                      <Checkbox 
                        checked={selectedQuizzes.includes(quiz.id)} 
                        onCheckedChange={() => toggleQuizSelection(quiz.id)}
                        className="h-5 w-5 bg-white/80 backdrop-blur"
                      />
                    </div>
                  )}
                  <QuizCard 
                    quiz={quiz} 
                    selectionMode={selectionMode}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12">
              <h3 className="text-lg font-medium">No quizzes found</h3>
              <p className="text-muted-foreground mt-1">
                Get started by creating your first quiz
              </p>
              <Link to="/create" className="mt-4 inline-block">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Quiz
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
