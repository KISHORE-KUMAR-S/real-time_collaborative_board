// Central RBAC policy: the single source of truth for "what can each role do".
//
// Enforcement everywhere checks a *permission*, never a role name directly, so
// adding a role or re-scoping a capability is a one-file change here. Roles are
// just named bundles of permissions.
import { Role } from "../types";

export const PERMISSIONS = [
  "board:read",
  "board:update",
  "board:delete",
  "card:create",
  "card:update",
  "card:delete",
  "member:read",
  "member:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const VIEWER: Permission[] = ["board:read", "member:read"];
const EDITOR: Permission[] = [
  ...VIEWER,
  "card:create",
  "card:update",
  "card:delete",
];
const OWNER: Permission[] = [
  ...EDITOR,
  "board:update",
  "board:delete",
  "member:manage",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: VIEWER,
  editor: EDITOR,
  owner: OWNER,
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
