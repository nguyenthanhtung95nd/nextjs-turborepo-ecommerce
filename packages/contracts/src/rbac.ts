import { z } from "zod";
import { searchTermSchema } from "./search";
import { passwordField } from "./auth";

export const USER_STATUS_FILTERS = ["ALL", "ACTIVE", "INACTIVE"] as const;
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number];

export const USERS_PAGE_SIZE = 10;

const MAX_ROLE_NAME_LENGTH = 60;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_PAGE = 10_000;

const ID_PATTERN = /^\d+$/;

/** `role` is a free string: the set lives in the database, and an unknown name matches nothing. */
export const userListParamsSchema = z.object({
  q: searchTermSchema,
  role: z.string().trim().max(MAX_ROLE_NAME_LENGTH).catch(""),
  status: z.enum(USER_STATUS_FILTERS).catch("ALL"),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
});

export type UserListParams = z.output<typeof userListParamsSchema>;

export const createUserSchema = z.object({
  email: z.email("Enter a valid email address.").max(MAX_EMAIL_LENGTH),
  name: z.string().trim().max(MAX_NAME_LENGTH),
  password: passwordField(),
  // Ids rather than names: a rename between loading the form and submitting it must not silently
  // assign a different role.
  roleIds: z.array(z.string().regex(ID_PATTERN)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userProfileSchema = z.object({
  name: z.string().trim().max(MAX_NAME_LENGTH),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const roleAssignmentSchema = z.object({
  roleIds: z.array(z.string().regex(ID_PATTERN)),
});

export type RoleAssignmentInput = z.infer<typeof roleAssignmentSchema>;

export const userStatusSchema = z.object({ isActive: z.boolean() });

// Mirrors the CHECK constraint on roles.name. Role names are read as constants in code, so they
// are held to the SCREAMING_SNAKE_CASE the seeds already use.
const ROLE_NAME_PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(MAX_ROLE_NAME_LENGTH, `Keep the name under ${MAX_ROLE_NAME_LENGTH} characters.`)
    .regex(ROLE_NAME_PATTERN, "Use capitals and underscores, e.g. CATALOG_EDITOR."),
  description: z
    .string()
    .trim()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`,
    ),
});

export type RoleFormInput = z.infer<typeof roleFormSchema>;

export const permissionAssignmentSchema = z.object({
  // Ids rather than keys: the catalog is seeded from code, and an id cannot be mistyped into
  // meaning a different permission.
  permissionIds: z.array(z.string().regex(ID_PATTERN)),
});

export type PermissionAssignmentInput = z.infer<typeof permissionAssignmentSchema>;

export interface UserRowDto {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  roleNames: string[];
  createdAt: string;
}

export interface UserDetailDto {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  assignedRoleIds: string[];
}

export interface UserCountsDto {
  total: number;
  /** Anyone holding at least one role; everyone else is a customer. */
  staff: number;
  deactivated: number;
}

export interface RoleOptionDto {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleRowDto extends RoleOptionDto {
  permissionCount: number;
  /** How many people hold this role — the reason a delete may not be offered. */
  userCount: number;
}

export interface RoleDetailDto extends RoleOptionDto {
  userCount: number;
  assignedPermissionIds: string[];
}

export interface PermissionOptionDto {
  id: string;
  key: string;
  description: string | null;
}

/** The signed-in person's own record, read fresh rather than taken from the session. */
export interface AccountOverviewDto {
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  roleNames: string[];
  permissionKeys: string[];
}
