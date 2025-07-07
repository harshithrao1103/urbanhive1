import { Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/layouts/Layout.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./components/redux/authSlice";
import { Toaster } from "sonner";
import Home from "./pages/Home/Home";
import CheckAuth from "./components/common/CheckAuth";
import Project from "./pages/Projects/Project";
import AuthPage from "./pages/Auth/AuthPage";
import Issue from "./pages/Issues/Issue";
import Resource from "./pages/resources/Resource";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import Donation from "./pages/Donations/Donation";
import Emergency from "./pages/Emergency/Emergency";
import RegionalPlanning from "./pages/RegionalPlanning/RegionalPlanning";
import NotFound from "./pages/NotFound/NotFound";
import ChatBot from "./pages/Chatbot/Chatbot";
function App() {
  const { user, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return <div>Loading...</div>; // Show a loader until auth check is complete
  }
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="" element={<Home />} />
        </Route>
        <Route
          path="/auth"
          element={
            <CheckAuth isAuthenticated={isAuthenticated}>
              <Layout />
            </CheckAuth>
          }>
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />
        </Route>
        {
          isAuthenticated && (
            <Route path="/" element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Project />} />
              <Route path="issues" element={<Issue />} />
              <Route path="resources" element={<Resource />} />
              <Route path="project/:id" element={<ProjectDetail />} />
              <Route path="donations" element={<Donation />} />
              <Route path="emergency" element={<Emergency />} />
              <Route path="regional-planning" element={<RegionalPlanning />} />
            </Route>
          )
        }
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatBot />
    </>
  );
}

export default App;
