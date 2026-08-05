/**
 * @file auth.ts
 * @description Zod schemas for login, register, recover, and password-update forms.
 * @dependencies zod
 */

import { z } from "zod";

/** Shared email validation used across auth forms. */
export const emailSchema = z.string().trim().email("Ingresa un correo válido.");

/** Shared password minimum length rule for register and update-password. */
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.");

/** Validates email/password login, including optional post-login `next` path. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
  next: z.string().optional(),
});

/** Validates signup fields and confirms password match. */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Ingresa tu nombre.")
      .max(80, "El nombre es demasiado largo."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

/** Validates password-recovery email input (also reused for resend confirmation). */
export const recoverSchema = z.object({
  email: emailSchema,
});

/** Validates new password + confirmation after recovery link. */
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecoverInput = z.infer<typeof recoverSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
