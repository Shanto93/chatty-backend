// import { z } from 'zod';

// export const registerSchema = z.object({
//   body: z.object({
//     email: z.string().email('Invalid email format'),
//     username: z
//       .string()
//       .min(3, 'Username must be at least 3 characters')
//       .max(20, 'Username must not exceed 20 characters')
//       .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
//     password: z.string().min(6, 'Password must be at least 6 characters'),
//     displayName: z.string().optional(),
//   }),
// });

// export const loginSchema = z.object({
//   body: z.object({
//     emailOrUsername: z.string().min(1, 'Email or username is required'),
//     password: z.string().min(1, 'Password is required'),
//   }),
// });

// export const refreshTokenSchema = z.object({
//   body: z.object({
//     refreshToken: z.string().min(1, 'Refresh token is required'),
//   }),
// });

import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must not exceed 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    displayName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().min(1, "Email or username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// ADD THIS NEW SCHEMA
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});
