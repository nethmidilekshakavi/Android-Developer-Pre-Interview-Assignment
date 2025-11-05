// models/LoanApplication.ts
export interface LoanApplication {
    id?: number;
    name: string;
    email: string;
    tel: string;
    occupation: string;
    salary: number;
    paysheetUri?: string | null;
    submittedAt?: string;
}