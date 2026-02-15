import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import Home from "./pages/Home";
import CreatorRequest from "./pages/CreatorRequest";
import CreatorDashboard from "./pages/CreatorDashboard";
import ChannelLive from "./pages/ChannelLive";
import AdminDashboard from "./pages/AdminDashboard";
import Post from "./pages/Post";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/creator/request" element={<CreatorRequest />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/posts/:postId" element={<Post />} />
          <Route path="/:channelName/live" element={<ChannelLive />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
