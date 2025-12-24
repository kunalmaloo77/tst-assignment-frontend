import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Complaints from "./pages/Complaints";
import Register from "./pages/Register";
import { TOKEN_KEY, USER_KEY } from "./utils.js/const";

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const loadAuth = () => {
  const storedToken = localStorage.getItem(TOKEN_KEY) || "";
  const storedUserRaw = localStorage.getItem(USER_KEY);

  try {
    return {
      token: storedToken,
      user: storedUserRaw ? JSON.parse(storedUserRaw) : null,
    };
  } catch (err) {
    return { token: storedToken, user: null };
  }
};

const PrivateRoute = ({ isAuthed, children }) => {
  return isAuthed ? children : <Navigate to="/" replace />;
};

function App() {
  const [{ token, user }, setAuth] = useState({ token: "", user: null });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = loadAuth();
    setAuth({ token: stored.token, user: stored.user });
    setInitializing(false);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setAuth({ token: "", user: null });
  };

  const isAuthed = Boolean(token);

  if (initializing) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Login isAuthed={isAuthed} setAuth={setAuth} />}
      />
      <Route
        path="/complaints"
        element={
          <PrivateRoute isAuthed={isAuthed}>
            <Complaints token={token} user={user} onLogout={handleLogout} />
          </PrivateRoute>
        }
      />
      <Route
        path="/register"
        element={<Register isAuthed={isAuthed} setAuth={setAuth} />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthed ? "/complaints" : "/"} replace />}
      />
    </Routes>
  );
}

export default App;
