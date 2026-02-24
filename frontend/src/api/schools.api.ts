import { apiClient } from "./client";
import type { ApiResponse } from "../types/api.types";
import type { School, UpdateSchoolInput } from "../types/school.types";

export const schoolsApi = {
  getCurrent: () =>
    apiClient.get<ApiResponse<School>>("/schools/current").then((r) => r.data),

  update: (input: UpdateSchoolInput) =>
    apiClient
      .patch<ApiResponse<School>>("/schools/current", input)
      .then((r) => r.data),
};
