
export enum QuizStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  DELETED = "deleted"
}

export interface Question {
  text: string;
  options: string[];
  correct_answer_index: number;
}

export interface QuizCreate {
  title: string;
  description?: string;
  questions: Question[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  status: QuizStatus;
  form_url?: string;
  form_id?: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface EmailRecipients {
  recipients: string[];
}
