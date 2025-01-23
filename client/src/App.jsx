import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import ProductList from "./components/ProductList";
import Login from "./components/Login";
import ConnectionStatus from "./components/ConnectionStatus";
import AuthProvider from "./contexts/providers/AuthProvider";
import { SocketProvider } from "./contexts/providers/SocketProvider";
import { SyncProvider } from "./contexts/providers/SyncProvider";

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
  return (
    <AuthProvider>
      <SocketProvider>
        <SyncProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <ProductList />
                  </PrivateRoute>
                }
              />
            </Routes>
            <ConnectionStatus />
          </Router>
        </SyncProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
