import React from 'react';
import { QueryClient, QueryClientProvider } from "react-query";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from "./Login";
import Main from "./Main";
import { UserProvider } from "./context/user-context";
import RequireAuth from "./components/RequireAuth";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={(
                <RequireAuth>
                  <Main />
                </RequireAuth>
              )}
            />
          </Routes>
        </Router>
        <ToastContainer position="bottom-center" autoClose={2000} />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
