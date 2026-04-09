export interface Question {
  id: string;
  type: 'mcq' | 'tf' | 'fill_blank';
  text: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  passageExcerpt?: string;
  keepOrder?: boolean;
}
