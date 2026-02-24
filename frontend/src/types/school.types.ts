export interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  logoS3Key: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSchoolInput {
  name?: string;
  address?: string;
  phone?: string;
}
