export declare class QuestionDto {
    prompt: string;
    options: string[];
    correct: number;
}
export declare class CreateQuizDto {
    title: string;
    dueAt: string;
    questions: QuestionDto[];
    studentIds: string[];
}
export declare class SubmitQuizDto {
    answers: number[];
}
