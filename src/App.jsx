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
/* ================= HOME (PRODUCT LANDING) ================= */
const Home = () => (
  <div className="bg-black text-white overflow-hidden">
    {/* HERO */}
    <section className="relative min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-black" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Celeone Live Platform
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            Go Live.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Own Your Channel.
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-400 max-w-xl">
            Celeone lets creators, churches, TV stations and communities stream
            live with professional infrastructure — no complexity, no limits.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/request"
              className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition flex items-center gap-2"
            >
              <FaBroadcastTower /> Create a Channel
            </Link>

            <Link
              to="/login"
              className="px-8 py-4 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition"
            >
              Broadcaster Login
            </Link>
          </div>
        </div>

        {/* MOCK PLAYER */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <FaPlay className="text-6xl text-white/80" />
            </div>
            <div className="p-4 flex justify-between text-sm text-gray-400">
              <span>Live Channel Preview</span>
              <span className="text-red-500">● LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="py-32 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center">
          Everything You Need to Go Live
        </h2>
        <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto">
          Built for reliability, speed and simplicity.
        </p>

        <div className="mt-20 grid md:grid-cols-3 gap-10">
          {[
            {
              icon: <FaVideo />,
              title: "Live Broadcasting",
              desc: "Stream in real time using OBS, mobile or professional encoders.",
            },
            {
              icon: <FaBroadcastTower />,
              title: "RTMP & HLS",
              desc: "Industry-standard RTMP ingest with auto-generated HLS playback.",
            },
            {
              icon: <FaUser />,
              title: "Channel Ownership",
              desc: "Each broadcaster controls their own channels and stream keys.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <div className="text-3xl text-blue-400">{f.icon}</div>
              <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section className="py-32 bg-gradient-to-b from-black to-blue-950/20 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center">How Celeone Works</h2>

        <div className="mt-20 grid md:grid-cols-4 gap-8 text-center">
          {[
            "Create an account",
            "Generate a channel",
            "Copy your stream key",
            "Go live instantly",
          ].map((step, i) => (
            <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-4xl font-extrabold text-blue-400 mb-3">
                {i + 1}
              </div>
              <p className="text-gray-300">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-32 text-center border-t border-white/10">
      <h2 className="text-5xl font-extrabold">
        Start Broadcasting on
        <span className="block text-blue-500">Celeone Today</span>
      </h2>

      <p className="mt-6 text-gray-400 max-w-xl mx-auto">
        Whether you're a TV station, church, creator or organization —
        Celeone gives you the power to broadcast globally.
      </p>

      <div className="mt-10">
        <Link
          to="/request"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-blue-600 hover:bg-blue-500 transition font-bold text-lg shadow-lg shadow-blue-500/30"
        >
          <FaBroadcastTower /> Create Your Channel
        </Link>
      </div>
    </section>
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
