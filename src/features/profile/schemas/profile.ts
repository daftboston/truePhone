import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El usuario debe tener al menos 3 caracteres.")
  .max(24, "El usuario es demasiado largo.")
  .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guion bajo.");

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre.")
    .max(80, "El nombre es demasiado largo."),
  username: usernameSchema.or(z.literal("")).optional(),
  city: z
    .string()
    .trim()
    .max(80, "La ciudad es demasiado larga.")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(80, "El departamento es demasiado largo.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(280, "La biografía puede tener máximo 280 caracteres.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "El teléfono es demasiado largo.")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
