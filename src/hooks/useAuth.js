import { useSelector } from "react-redux";

/**
 * Hook to check if user has a specific role
 * @param {string|string[]} requiredRole - Role(s) to check
 * @returns {boolean}
 */
export const useHasRole = (requiredRole) => {
  const { role } = useSelector((state) => state.auth);

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }

  return role === requiredRole;
};

/**
 * Hook to check if user is authenticated
 * @returns {boolean}
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated;
};

/**
 * Hook to get current user info
 * @returns {object} User object with email, role, token
 */
export const useAuth = () => {
  const { user, token, role, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    token,
    role,
    isAuthenticated,
    loading,
  };
};

/**
 * Hook to get user's first name from email
 * @returns {string}
 */
export const useUserName = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.email) {
    return user.email.split("@")[0];
  }
  return "User";
};

/**
 * Hook to check if user is admin
 * @returns {boolean}
 */
export const useIsAdmin = () => {
  const { role } = useSelector((state) => state.auth);
  return role === "admin";
};

/**
 * Hook to check if user is manager
 * @returns {boolean}
 */
export const useIsManager = () => {
  const { role } = useSelector((state) => state.auth);
  return role === "manager";
};

/**
 * Hook to check if user is team leader
 * @returns {boolean}
 */
export const useIsTeamLeader = () => {
  const { role } = useSelector((state) => state.auth);
  return role === "teamLeader";
};

/**
 * Hook to check if user is telecaller
 * @returns {boolean}
 */
export const useIsTelecaller = () => {
  const { role } = useSelector((state) => state.auth);
  return role === "telecaller";
};
