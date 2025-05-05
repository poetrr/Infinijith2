
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createQuiz, createQuizFromFile, createQuizFromText } from '@/services/api';
import { QuizCreate, Question } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  TrashIcon, 
  ArrowLeft, 
  Send, 
  X, 
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      options: ['', ''],
      correct_answer_index: 0,
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState('');
  const [tabValue, setTabValue] = useState('manual');
  const [suggestedTitle, setSuggestedTitle] = useState('');

  const createQuizMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      toast.success('Quiz created successfully');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quiz: ${error.message}`);
    },
  });

  const createQuizFromFileMutation = useMutation({
    mutationFn: createQuizFromFile,
    onSuccess: () => {
      toast.success('Quiz created successfully from file');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quiz from file: ${error.message}`);
    },
  });

  const createQuizFromTextMutation = useMutation({
    mutationFn: (text: string) => createQuizFromText(text, suggestedTitle || undefined),
    onSuccess: () => {
      toast.success('Quiz created successfully from text');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quiz from text: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }

      if (q.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Option ${j + 1} for Question ${i + 1} is required`);
          return;
        }
      }
    }

    const quizData: QuizCreate = {
      title,
      description: description.trim() ? description : undefined,
      questions,
    };

    createQuizMutation.mutate(quizData);
  };

  const handleRawTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rawText.trim()) {
      toast.error('Please enter some text for the quiz');
      return;
    }
    
    createQuizFromTextMutation.mutate(rawText);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', ''],
        correct_answer_index: 0,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast.error('You need at least one question');
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updatedQuestions = [...questions];
    
    if (field === 'text') {
      updatedQuestions[index].text = value as string;
    } else if (field === 'correct_answer_index') {
      updatedQuestions[index].correct_answer_index = value as number;
    }
    
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    
    // Don't remove if there are only 2 options
    if (updatedQuestions[questionIndex].options.length <= 2) {
      toast.error('Questions must have at least 2 options');
      return;
    }
    
    // Update correct answer index if needed
    if (optionIndex === updatedQuestions[questionIndex].correct_answer_index) {
      updatedQuestions[questionIndex].correct_answer_index = 0;
    } else if (optionIndex < updatedQuestions[questionIndex].correct_answer_index) {
      updatedQuestions[questionIndex].correct_answer_index--;
    }
    
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    // Only accept text files
    if (file.type !== 'text/plain' && !file.name.endsWith('.md')) {
      toast.error('Only text files (.txt, .md) are supported');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    if (suggestedTitle) {
      formData.append('suggested_title', suggestedTitle);
    }
    
    createQuizFromFileMutation.mutate(formData);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="text">From Text</TabsTrigger>
          <TabsTrigger value="file">From File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter quiz description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Questions</h2>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <Card key={qIndex} className="relative">
                  <Button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>

                  <CardHeader>
                    <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${qIndex}`}>Question Text</Label>
                      <Input
                        id={`question-${qIndex}`}
                        placeholder="Enter question text"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Options</Label>
                        <Button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                        >
                          <PlusCircle className="h-3 w-3" />
                          Add Option
                        </Button>
                      </div>
                      
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2 items-center">
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, oIndex, e.target.value)
                            }
                            required
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`correct-${qIndex}-${oIndex}`}
                              name={`correct-${qIndex}`}
                              checked={question.correct_answer_index === oIndex}
                              onChange={() =>
                                updateQuestion(qIndex, 'correct_answer_index', oIndex)
                              }
                              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <Label
                              htmlFor={`correct-${qIndex}-${oIndex}`}
                              className="text-sm"
                            >
                              Correct
                            </Label>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createQuizMutation.isPending}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {createQuizMutation.isPending
                  ? 'Creating Quiz...'
                  : 'Create Quiz'}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Create Quiz from Text</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRawTextSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="suggested-title">Suggested Title (Optional)</Label>
                  <Input
                    id="suggested-title"
                    placeholder="Suggest a title for the quiz"
                    value={suggestedTitle}
                    onChange={(e) => setSuggestedTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raw-text">Quiz Content</Label>
                  <Textarea
                    id="raw-text"
                    placeholder="Paste your quiz content here. Our AI will extract questions and answers automatically."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={createQuizFromTextMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  {createQuizFromTextMutation.isPending ? 'Processing...' : 'Create Quiz from Text'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Upload Text File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upload a text file (.txt, .md) containing your quiz content. Our AI will automatically extract questions and answers.
              </p>
              <div className="space-y-2">
                <Label htmlFor="suggested-title-file">Suggested Title (Optional)</Label>
                <Input
                  id="suggested-title-file"
                  placeholder="Suggest a title for the quiz"
                  value={suggestedTitle}
                  onChange={(e) => setSuggestedTitle(e.target.value)}
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.md"
              />
              <Button
                type="button"
                onClick={triggerFileUpload}
                variant="outline"
                className="w-full h-32 border-dashed gap-2 flex flex-col items-center justify-center"
                disabled={createQuizFromFileMutation.isPending}
              >
                <Upload className="h-8 w-8 opacity-50" />
                <span className="font-medium">
                  {createQuizFromFileMutation.isPending ? 'Uploading...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-muted-foreground">
                  TXT or MD files only
                </span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateQuiz;
