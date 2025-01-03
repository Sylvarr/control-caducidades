import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect, createContext } from "react";
import PropTypes from "prop-types";
import ProductList from "./components/ProductList";
import Login from "./components/Login";
import { SocketProvider } from "./contexts/SocketContext";

// Crear contexto de autenticación
export const AuthContext = createContext(null);

const PrivateRoute = ({ children }) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsAuthenticated(!!token);

      if (token) {
        // Obtener información del usuario
        fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              setUser(data);
            }
          })
          .catch(console.error);
      }
    };

    checkAuth();
  }, []);

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <SocketProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <ProductList />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthContext.Provider>
  );
};

export default App;
