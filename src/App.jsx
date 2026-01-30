// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  FaPlay,
  FaUser,
  FaVideo,
  FaCopy,
  FaBroadcastTower,
} from "react-icons/fa";

/* ================= NAVBAR ================= */
const Navbar = ({ user, handleLogout }) => (
  <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link
        to="/"
        className="text-2xl font-extrabold tracking-tight text-white"
      >
        Celeone<span className="text-blue-500">TV</span>
      </Link>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm text-gray-400">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm"
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition text-sm font-semibold shadow-lg shadow-blue-500/30"
        >
          Login
        </Link>
      )}
    </div>
  </nav>
);

/* ================= HOME ================= */
const Home = () => (
  <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-black to-black -z-10" />

    <div className="px-6 pt-24 max-w-4xl">
      <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
        Live Streaming Platform
      </span>

      <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
        Stream your
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Channel Live
        </span>
      </h1>

      <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
        Create channels, generate stream keys, and broadcast instantly with
        professional-grade infrastructure.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/request"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition"
        >
          <FaBroadcastTower /> Create Channel
        </Link>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition border border-white/10"
        >
          <FaUser /> Broadcaster Login
        </Link>
      </div>
    </div>
  </div>
);

/* ================= LOGIN ================= */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black pt-16">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center">
          Broadcaster Login
        </h2>
        <p className="text-center text-gray-400 mt-2">
          Access your streaming dashboard
        </p>

        {error && (
          <div className="mt-4 p-3 text-sm rounded bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-bold shadow-lg shadow-blue-500/30">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

/* ================= DASHBOARD ================= */
const Dashboard = ({ user }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(
        collection(db, "channels"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      setChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [user]);

  const createChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    setLoading(true);
    const streamKey = crypto.randomUUID().replace(/-/g, "");

    await addDoc(collection(db, "channels"), {
      channelName: newChannelName,
      streamKey,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setChannels([...channels, { channelName: newChannelName, streamKey }]);
    setNewChannelName("");
    setLoading(false);
  };

  const copy = (v) => navigator.clipboard.writeText(v);

  return (
    <div className="min-h-screen bg-black pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mb-8">
          Manage your live streaming channels
        </p>

        {/* CREATE CHANNEL */}
        <form
          onSubmit={createChannel}
          className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-4"
        >
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Channel name"
            className="flex-1 p-3 rounded-lg bg-black border border-white/10 text-white outline-none"
          />
          <button
            disabled={loading}
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-bold disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>

        {/* CHANNELS */}
        <div className="space-y-6">
          {channels.map((c) => (
            <div
              key={c.streamKey}
              className="rounded-xl overflow-hidden bg-white/5 border border-white/10"
            >
              <div className="p-5 flex justify-between items-center bg-black/40">
                <h3 className="text-xl font-bold text-white">
                  {c.channelName}
                </h3>
                <span className="flex items-center gap-2 text-green-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  LIVE READY
                </span>
              </div>

              <div className="p-5 grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">RTMP URL</p>
                  <div className="flex bg-black p-2 rounded border border-white/10">
                    <code className="flex-1 text-blue-400 truncate">
                      rtmp://live.celeonetv.com/live
                    </code>
                    <button onClick={() => copy("rtmp://live.celeonetv.com/live")}>
                      <FaCopy />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-4 mb-1">
                    Stream Key
                  </p>
                  <div className="flex bg-black p-2 rounded border border-white/10">
                    <code className="flex-1 text-yellow-400 truncate">
                      {c.streamKey}
                    </code>
                    <button onClick={() => copy(c.streamKey)}>
                      <FaCopy />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">HLS Link</p>
                  <div className="bg-black p-3 rounded border border-white/10 text-xs text-blue-300 break-all">
                    https://live.celeonetv.com/hls/{c.streamKey}.m3u8
                  </div>
                  <button
                    onClick={() =>
                      copy(
                        `https://live.celeonetv.com/hls/${c.streamKey}.m3u8`
                      )
                    }
                    className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded"
                  >
                    Copy HLS URL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <Router>
      <Navbar user={user} handleLogout={() => signOut(auth)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Login />}
        />
        <Route
          path="/request"
          element={user ? <Dashboard user={user} /> : <Login />}
        />
      </Routes>
    </Router>
  );
}
