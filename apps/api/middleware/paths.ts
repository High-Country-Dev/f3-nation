import { routes } from "@acme/shared/app/constants";

// Basic is just signed in
// Editor can change data for their region
// Admin can change anything
type AuthType = "none" | "admin" | "basic" | "editor";

interface RouteBase {
  __path: string;
  __auth: AuthType;
}

type Route = RouteBase & {
  [K: string]: Route | string;
};

type Routes = Record<string, Route>;

const getAuthRoutes = (authRoutes: Routes, auth: AuthType): string[] => {
  const authPaths: string[] = [];

  const traverse = (obj: RouteBase | Routes, _parentKey = "") => {
    if (
      "__path" in obj &&
      typeof obj.__path === "string" &&
      obj.__auth === auth
    ) {
      authPaths.push(obj.__path);
    }

    for (const [key, value] of Object.entries(obj as Record<string, Route>)) {
      if (!["__path", "__auth"].includes(key)) {
        traverse(value, key);
      }
    }
  };

  traverse(authRoutes);
  return authPaths;
};

export const ADMIN_PATHS = getAuthRoutes(routes, "admin");
export const EDITOR_PATHS = getAuthRoutes(routes, "editor");
