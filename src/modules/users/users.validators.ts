import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(50).optional(),
    statusMessage: z.string().max(200).optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});
