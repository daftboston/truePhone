import { z } from "zod";

export const emailSchema = z.string().trim().email("Ingresa un correo válido.");

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
  next: z.string().optional(),
});

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

export const recoverSchema = z.object({
  email: emailSchema,
});

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
