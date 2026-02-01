import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =============================
     Load auth state on app start
     ============================= */
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        // Incomplete auth state → reset
        localStorage.clear();
      }
    } catch (err) {
      // Corrupted localStorage → reset
      console.error("Auth storage corrupted, resetting", err);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  /* =============================
     Login
     ============================= */
  const login = (data) => {
    /*
      🔥 CRITICAL FIX
      Clear any previous user/session data
      to prevent token/user mismatch
    */
    localStorage.clear();

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.access_token);
    setUser(data.user);
  };

  /* =============================
     Logout
     ============================= */
  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  /* =============================
     Context Provider
     ============================= */
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
