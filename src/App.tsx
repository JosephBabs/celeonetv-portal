import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import Home from "./pages/Home";
import CreatorRequest from "./pages/CreatorRequest";
import ChannelLive from "./pages/ChannelLive";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Post from "./pages/Post";
import MarketplaceShare from "./pages/MarketplaceShare";
import MarketplaceHome from "./pages/MarketplaceHome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/creator/request" element={<CreatorRequest />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/posts/:postId" element={<Post />} />
          <Route path="/market/:kind/:entityId" element={<MarketplaceShare />} />
          <Route path="/market" element={<MarketplaceHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          <Route path="/:channelName/live" element={<ChannelLive />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
