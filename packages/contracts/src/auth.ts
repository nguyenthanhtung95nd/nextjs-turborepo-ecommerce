import { z } from "zod";

/** Short enough to type, long enough to be worth hashing. Raise it, never lower it. */
export const MIN_PASSWORD_LENGTH = 8;

// bcrypt only reads the first 72 bytes; the cap stops a megabyte of text reaching the hasher.
const MAX_PASSWORD_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;

export function passwordField() {
  return z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(MAX_PASSWORD_LENGTH, `Keep it under ${MAX_PASSWORD_LENGTH} characters.`);
}

// Lower-cased so one address cannot become two accounts: the unique index is on the raw column.
const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(MAX_EMAIL_LENGTH)
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().max(MAX_NAME_LENGTH, "Keep your name under 100 characters."),
    email: emailField,
    password: passwordField(),
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The two passwords don't match.",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    // Not length-checked: it is checked against the stored hash.
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordField(),
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The two passwords don't match.",
      });
    }
    if (values.newPassword === values.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a password you aren't already using.",
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** What the API returns on a successful sign-in or registration. */
export interface AuthenticatedUserDto {
  id: string;
  email: string;
  name: string | null;
  permissions: string[];
  accessToken: string;
}

/** The signed-in user, without the token. */
export type CurrentUserDto = Omit<AuthenticatedUserDto, "accessToken">;
