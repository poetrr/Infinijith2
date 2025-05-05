
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchQuizById, approveQuiz, deleteQuiz } from '@/services/api';
import { QuizStatus, EmailRecipients } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Trash,
  ExternalLink,
  CalendarIcon,
  Clock,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState<string>('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => fetchQuizById(id || ''),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      toast.success('Quiz deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete quiz: ${error.message}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { quizId: string; emailData: EmailRecipients }) =>
      approveQuiz(data.quizId, data.emailData),
    onSuccess: () => {
      toast.success('Quiz approved and emails sent successfully');
      queryClient.invalidateQueries({ queryKey: ['quiz', id] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setShowApproveDialog(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve quiz: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const handleApprove = () => {
    if (!id) return;

    const emailList = recipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);

    if (emailList.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    const emailData: EmailRecipients = {
      recipients: emailList,
    };

    approveMutation.mutate({ quizId: id, emailData });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const getStatusColor = (status?: QuizStatus) => {
    switch (status) {
      case QuizStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case QuizStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case QuizStatus.DELETED:
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load quiz. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <Badge className={getStatusColor(quiz.status)}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </Badge>

        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Created: {formatDate(quiz.created_at)}</span>
        </div>

        <div className="flex items-center text-sm text-muted-foreground gap-1">
          <Clock className="h-4 w-4" />
          <span>Updated: {formatDate(quiz.updated_at)}</span>
        </div>
      </div>

      {quiz.description && (
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-secondary-foreground">{quiz.description}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quiz Form</CardTitle>
        </CardHeader>
        <CardContent>
          {quiz.form_url ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-medium">Access this quiz at:</span>
              <a
                href={quiz.form_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center gap-1 underline"
              >
                <span>Open in Google Forms</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No form available</AlertTitle>
              <AlertDescription>
                This quiz doesn't have an associated Google Form yet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" disabled={quiz.status === QuizStatus.DELETED}>
              <Trash className="h-4 w-4" />
              Delete Quiz
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the quiz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              disabled={quiz.status !== QuizStatus.DRAFT}
            >
              <Mail className="h-4 w-4" />
              Approve & Send
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Quiz to Recipients</DialogTitle>
              <DialogDescription>
                Enter email addresses separated by commas. Recipients will receive a link to the Google Form.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Email Recipients</Label>
                <Textarea
                  id="emails"
                  placeholder="email1@example.com, email2@example.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {approveMutation.isPending ? 'Sending...' : 'Send Quiz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default QuizDetail;
