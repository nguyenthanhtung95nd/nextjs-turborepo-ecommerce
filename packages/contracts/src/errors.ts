/** The body the API returns for every 4xx and 5xx. */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  /** Field name → message, present only when validation failed. */
  errors?: Record<string, string>;
}
