export enum Role {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
}

export interface Message {
    id: string;
    role: Role;
    content: string;
}

export enum StudyStyle {
    ASSISTANT = 'Assistant',
    SUMMARY = 'Short summary',
    DETAILED = 'Detailed notes',
    EXAM = 'Exam style',
    CHEAT_SHEET = 'Cheat Sheet (formulas)',
    MCQ = 'MCQs',
    CUSTOM = 'Custom',
}

export enum Difficulty {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    ADVANCED = 'Advanced',
}
