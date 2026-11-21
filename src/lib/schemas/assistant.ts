import { z } from "zod";

export const assistantQuerySchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Ask a financial question using at least 3 characters")
    .max(1000, "Question must be 1,000 characters or fewer"),
});

export const assistantConsentSchema = z.object({
  consent: z.boolean({ invalid_type_error: "Consent must be true or false" }),
});
