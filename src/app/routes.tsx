import { createBrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";

import Landing from "../pages/Landing";
import ChannelLive from "../pages/ChannelLive";
import Post from "../pages/Post";

import CreatorRequest from "../pages/CreatorRequest";
import CreatorDashboard from "../pages/CreatorDashboard";
import AdminDashboard from "../pages/AdminDashboard";

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

      // Admin
      { path: "/admin", element: <AdminDashboard /> },
    ],
  },
]);
