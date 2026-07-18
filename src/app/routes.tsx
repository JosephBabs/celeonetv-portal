import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "./AppShell";

import Landing from "../pages/Landing";
import ChannelLive from "../pages/ChannelLive";
import Post from "../pages/Post";

import CreatorRequest from "../pages/CreatorRequest";
import AdminDashboard from "../pages/AdminDashboard";
import AdminManagePage from "../pages/AdminManagePage";
import AdminRoute from "../routes/AdminRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PrelaunchRegistration from "../pages/PrelaunchRegistration";
import DonateRedirect from "../pages/DonateRedirect";
import Founders from "../pages/Founders";
import FounderActivate from "../pages/FounderActivate";
import FounderCertificate from "../pages/FounderCertificate";
import FounderDashboard from "../pages/FounderDashboard";
import FounderVerify from "../pages/FounderVerify";
import FounderWall from "../pages/FounderWall";
import FounderHubPage from "../pages/FounderHubPage";
import AdminFounders from "../pages/AdminFounders";
import AdminFounderCertificate from "../pages/AdminFounderCertificate";
import Documentation from "../pages/Documentation";
import SpiritualProgram from "../pages/SpiritualProgram";
import AdminSpiritualProgram from "../pages/AdminSpiritualProgram";
import RouteError from "../pages/RouteError";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Landing /> },

      // Public content
      { path: "/posts/:postId", element: <Post /> },

      // Live page (public share)
      { path: "/:channelName/live", element: <ChannelLive /> },

      // Creator
      { path: "/creator/request", element: <CreatorRequest /> },
      { path: "/creator", element: <Navigate to="/" replace /> },
      { path: "/chatrooms/create", element: <Navigate to="/" replace /> },
      { path: "/documentation", element: <Documentation /> },
      { path: "/spiritual-program", element: <SpiritualProgram /> },
      { path: "/jeunesse", element: <Navigate to="/" replace /> },
      { path: "/login", element: <Login /> },
      { path: "/logout", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/donate", element: <DonateRedirect /> },
      { path: "/prelaunch-registration", element: <PrelaunchRegistration /> },
      { path: "/founders", element: <Founders /> },
      { path: "/founders/activate", element: <FounderActivate /> },
      { path: "/founders/certificate", element: <FounderCertificate /> },
      { path: "/founders/dashboard", element: <FounderDashboard /> },
      { path: "/founders/wall", element: <FounderWall /> },
      { path: "/founders/verify", element: <FounderVerify /> },
      { path: "/founders/verify/:founderId", element: <FounderVerify /> },
      { path: "/founders/:section", element: <FounderHubPage /> },


      // Admin
      {
        path: "/admin",
        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/founders/members/:founderId/certificate",
        element: (
          <AdminRoute>
            <AdminFounderCertificate />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/founders",
        element: (
          <AdminRoute>
            <AdminFounders />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/:section",
        element: (
          <AdminRoute>
            <AdminManagePage />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/spiritual-program",
        element: (
          <AdminRoute>
            <AdminSpiritualProgram />
          </AdminRoute>
        ),
      },
      { path: "*", element: <RouteError status={404} /> },
    ],
  },
]);
