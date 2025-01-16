export type Question = {
    id: number;
    title: string;
    description: string;
    options: string[];
    votes: Record<string, number>;
    order: number;
    created_at?: Date;
  };
  
  export type DBQuestion = {
    id: number;
    title: string;
    description: string;
    options: string;  // JSON string in DB
    votes: string;    // JSON string in DB
    order: number;
    created_at?: Date;
  };
  
  export type SocketData = {
    questions: Question[];
    currentQuestionIndex?: number;
  };

  export type UserSessionState = 'waiting' | 'active' | 'ended';