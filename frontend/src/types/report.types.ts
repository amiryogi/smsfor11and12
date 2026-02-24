export interface GradeResultSummary {
  gradeId: string;
  gradeName: string;
  totalStudents: number;
  passCount: number;
  failCount: number;
  averagePercentage: number;
  gradeDistribution: Record<string, number>;
}

export interface FinancialLedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface StudentFinancialStatement {
  studentId: string;
  studentName: string;
  totalFees: number;
  totalPaid: number;
  totalOutstanding: number;
  invoices: {
    invoiceNo: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
  }[];
}

export interface OutstandingStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  gradeName: string;
  totalOutstanding: number;
}

export interface StudentSummary {
  totalActive: number;
  totalGraduated: number;
  totalDropout: number;
  totalTransferred: number;
  byGrade: { gradeId: string; gradeName: string; count: number }[];
}
