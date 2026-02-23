import { createBrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";

import Landing from "../pages/Landing";
import ChannelLive from "../pages/ChannelLive";
import Post from "../pages/Post";

import CreatorRequest from "../pages/CreatorRequest";
import CreatorDashboard from "../pages/CreatorDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import AdminManagePage from "../pages/AdminManagePage";
import AdminRoute from "../routes/AdminRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import CreateChatroom from "../pages/CreateChatroom";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Landing /> },

      // Public content
      { path: "/posts/:postId", element: <Post /> },

      // Live page (public share)
      { path: "/:channelName/live", element: <ChannelLive /> },

      // Creator
      { path: "/creator/request", element: <CreatorRequest /> },
      { path: "/creator", element: <CreatorDashboard /> },
      { path: "/chatrooms/create", element: <CreateChatroom /> },
      { path: "/login", element: <Login /> },
      { path: "/logout", element: <Login /> },
      { path: "/register", element: <Register /> },


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
        path: "/admin/:section",
        element: (
          <AdminRoute>
            <AdminManagePage />
          </AdminRoute>
        ),
      },
    ],
  },
]);
