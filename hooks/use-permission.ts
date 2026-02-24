"use client";

import { useAuth } from "./use-auth";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

type Action = "view" | "edit" | "delete";

// Helper to normalize paths (removes trailing slashes)
function normalizePath(path: string) {
  return path.replace(/\/+$/, "");
}

export function usePermission() {
  const { user } = useAuth();
  const router = useRouter();
  

  const can = useCallback(
    (action: Action, path: string): boolean => {
      if (!user) {
        return false;
      }
      if (user.role === "admin" || user.role === "subadmin" ) {
        return true;
      }

      const normalizedPath = normalizePath(path);
      return user.permissions.some((perm: string) => {
        const [permResource, permAction] = perm.split(":");
        return (
          normalizePath(permResource) === normalizedPath &&
          permAction === action
        );
      });
    },
    [user]
  );

  /////////////////////////////////////////////////////////////

  const canCMS = useCallback(
    (action: Action): boolean => {
      // If user is restricted from CMS
      if (user?.permissions?.includes?.("cms")) {
        console.warn(" User is restricted from CMS!");
        return false;
      }

      // Otherwise, check normal permission
      return can(action, "cms");
    },
    [user, can]
  );

  // ///////////////////////////////////////////////////////////////////////

  //  const canCMS = useCallback(
  //     (action: Action, path: string): boolean => {
  //       if (!user) {
  //         router.push("/dashboard");
  //         return false;
  //       }

  //       // Admins can always access CMS
  //       if (user.role === "admin") {
  //         return true;
  //       }

  //       const normalizedPath = normalizePath(path);
  //       const hasPermission = user.permissions?.some((perm: string) => {
  //         const [permResource, permAction] = perm.split(":");
  //         return (
  //           normalizePath(permResource) === normalizedPath &&
  //           permAction === action
  //         );
  //       });

  //       if (!hasPermission) {
  //         router.push("/dashboard");
  //         return false;
  //       }

  //       return true;
  //     },
  //     [user, router]
  //   );

  return { can, canCMS };
}

///////////////////////////////////////////////////////////////////////////////
