export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  status: "ACTIVE" | "GRADUATED" | "DROPOUT" | "TRANSFERRED" | "SUSPENDED";
  profilePicUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  parentId?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  gradeId: string;
  gradeName: string;
  sectionName?: string;
  academicYearId: string;
  academicYearName: string;
  rollNo?: string;
  status: string;
}
