import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    roomId: z.string().min(1),
    attachment: z
      .object({
        type: z.enum(["IMAGE", "FILE"]),
        url: z.string().url(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      })
      .optional(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    roomId: z.string().min(1),
  }),
  query: z.object({
    limit: z.string().optional(),
    cursor: z.string().optional(),
  }),
});

export const uploadAttachmentSchema = z.object({
  params: z.object({
    roomId: z.string().min(1),
  }),
});
