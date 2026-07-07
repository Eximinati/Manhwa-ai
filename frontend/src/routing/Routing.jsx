// src/routing/Routing.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Layout components
import Navbar from "../layout/Header";
import Footer from "../layout/Footer";
import ScrollToTop from "../components/ScrollonTop";
import DocumentationPage from "../pages/Documentation";


import HomePage from "../pages/Home";
import UploadPage from "../pages/Upload";
import AuthCallback from "../components/auth/AuthCallback";
import NotFoundPage from "../pages/NotFound";
const LibraryPage = lazy(() => import("../pages/Library"));
const ContactPage = lazy(() => import("../pages/Contact"));

const LoginPage = lazy(() => import("../pages/Login"));

// Layout Wrapper
const Layout = ({ children }) => {
  const location = useLocation();

  // CHANGED: Added /auth/callback to hide layout routes
  const hideLayoutRoutes = ["/login", "/signup", "/auth/callback"];
  const hideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
};

const Routing = () => {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* HOME — NO SUSPENSE */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />

        {/* OTHER PAGES — SUSPENSE OK */}
        <Route
          path="/upload"
          element={
            <Suspense fallback={null}>
              <Layout>
                <UploadPage />
              </Layout>
            </Suspense>
          }
        />

        <Route
          path="/library"
          element={
            <Suspense fallback={null}>
              <Layout>
                <LibraryPage />
              </Layout>
            </Suspense>
          }
        />

        <Route
          path="/contact"
          element={
            <Suspense fallback={null}>
              <Layout>
                <ContactPage />
              </Layout>
            </Suspense>
          }
        />

        <Route
          path="/docs"
          element={
            <Layout>
              <DocumentationPage />
            </Layout>
          }
        />

        <Route
          path="/login"
          element={
            <Suspense fallback={null}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* AUTH CALLBACK - No Layout */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 404 - CATCH ALL */}
        <Route
          path="*"
          element={
            <Layout>
              <NotFoundPage />
            </Layout>
          }
        />
      </Routes>
    </>
  );
};

export default Routing;