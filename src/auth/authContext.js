import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load from localStorage on startup
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (role && token) {
      setUser({ role, token });
    }
  }, []);

  const login = ({ role, token }) => {
    setUser({ role, token });
    localStorage.setItem("role", role);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("role");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
