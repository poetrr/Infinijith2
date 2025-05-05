
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz, QuizStatus } from '@/types/quiz';
import { CalendarIcon, FileEditIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface QuizCardProps {
  quiz: Quiz;
  selectionMode?: boolean;
}

export function QuizCard({ quiz, selectionMode }: QuizCardProps) {
  const statusColors = {
    [QuizStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
    [QuizStatus.APPROVED]: 'bg-green-100 text-green-800',
    [QuizStatus.DELETED]: 'bg-red-100 text-red-800',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card className={`h-full flex flex-col hover:shadow-md transition-shadow duration-200 ${selectionMode ? 'opacity-90' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold truncate">{quiz.title}</CardTitle>
          <Badge className={statusColors[quiz.status]}>
            {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {quiz.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Created: {formatDate(quiz.created_at)}</span>
        </div>
        <div className="mt-2 text-sm">
          <span className="font-medium">{quiz.questions?.length || 0}</span> question{quiz.questions?.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
      <CardFooter>
        {!selectionMode && (
          <Link to={`/quizzes/${quiz.id}`} className="w-full">
            <Button variant="default" className="w-full gap-2">
              <FileEditIcon className="h-4 w-4" />
              View Details
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
