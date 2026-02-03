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
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { FaPlay, FaUser, FaVideo, FaCopy, FaBroadcastTower } from "react-icons/fa";

/* ================= NAVBAR ================= */
const Navbar = ({ user, handleLogout }) => (
  <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="text-2xl font-extrabold tracking-tight text-white">
        Celeone<span className="text-[#2FA5A9]">TV</span>
      </Link>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full bg-[#2FA5A9]/20 hover:bg-[#2FA5A9]/30 transition text-sm"
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="px-5 py-2 rounded-full bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 transition text-sm font-semibold shadow-lg shadow-[#2FA5A9]/30"
        >
          Login
        </Link>
      )}
    </div>
  </nav>
);

/* ================= HOME ================= */
const Home = () => (
  <div className="bg-black text-white overflow-hidden">
    <section className="relative min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2FA5A9]/30 via-black to-black" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block mb-4 px-4 py-1 rounded-full text-sm bg-[#2FA5A9]/10 text-[#2FA5A9] border border-[#2FA5A9]/20">
            Celeone Live Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            Go Live.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#2FA5A9] to-purple-500">
              Own Your Channel.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-xl">
            Cele One connects members of the Celestial Church of Christ around the world.
            Access church news, official documents, discussions, and live content — all in one place to strengthen faith, unity, and community.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/request"
              className="px-8 py-4 rounded-full bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 transition flex items-center gap-2 font-bold"
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
        <h2 className="text-3xl font-bold text-white text-center">Broadcaster Login</h2>
        <p className="text-center text-gray-400 mt-2">Access your streaming dashboard</p>
        {error && <div className="mt-4 p-3 text-sm rounded bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}
        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black border border-white/10 text-white focus:ring-2 focus:ring-[#2FA5A9] outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black border border-white/10 text-white focus:ring-2 focus:ring-[#2FA5A9] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full py-3 rounded-lg bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 transition font-bold shadow-lg shadow-[#2FA5A9]/30">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

/* ================= ADMIN PAGE ================= */
const AdminPage = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const q = query(collection(db, "channels"), where("approved", "==", false));
      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  const approve = async (id) => {
    const docRef = doc(db, "channels", id);
    await updateDoc(docRef, { approved: true });
    setRequests(requests.filter((r) => r.id !== id));
  };

  const reject = async (id) => {
    const docRef = doc(db, "channels", id);
    await db.deleteDoc(docRef);
    setRequests(requests.filter((r) => r.id !== id));
  };

  if (loading) return <p className="text-white p-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-black pt-24 px-6">
      <h1 className="text-3xl font-bold text-white mb-8">Pending Channel Requests</h1>
      {requests.length === 0 && <p className="text-gray-400">No pending requests.</p>}
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="p-4 bg-white/5 border border-[#2FA5A9] rounded-xl flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold">{r.name}</h3>
              <p className="text-gray-400 text-sm">{r.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => approve(r.id)} className="px-4 py-2 bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 rounded text-white">Approve</button>
              <button onClick={() => reject(r.id)} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= DASHBOARD ================= */
const Dashboard = ({ user, isAdmin }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [podcastInput, setPodcastInput] = useState("");
  const [programInput, setProgramInput] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchChannels = async () => {
      const q = query(collection(db, "channels"), where("ownerId", "==", user.uid), where("approved", "==", true));
      const snap = await getDocs(q);
      setChannels(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchChannels();
  }, [user]);

  const createChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setLoading(true);
    const streamKey = crypto.randomUUID().replace(/-/g, "");
    await addDoc(collection(db, "channels"), {
      name: newChannelName,
      description: `${newChannelName} description`,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      approved: false,
      streamKey,
    });
    setNewChannelName("");
    setLoading(false);
    alert("Channel request submitted! Waiting for admin approval.");
  };

  const copy = (v) => navigator.clipboard.writeText(v);

  // Add Podcast
  const addPodcast = async (channelId) => {
    if (!podcastInput.trim()) return;
    await addDoc(collection(db, "channels", channelId, "podcasts"), {
      name: podcastInput,
      createdAt: serverTimestamp(),
    });
    setPodcastInput("");
    alert("Podcast added!");
  };

  // Add Program
  const addProgram = async (channelId) => {
    if (!programInput.trim()) return;
    await addDoc(collection(db, "channels", channelId, "programs"), {
      name: programInput,
      createdAt: serverTimestamp(),
    });
    setProgramInput("");
    alert("Program added!");
  };

  if (isAdmin) return <AdminPage user={user} />;

  return (
    <div className="min-h-screen bg-black pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Your Channels</h1>
        <form onSubmit={createChannel} className="mb-10 p-6 rounded-xl bg-white/5 border border-[#2FA5A9] flex flex-col sm:flex-row gap-4">
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="Channel name"
            className="flex-1 p-3 rounded-lg bg-black border border-[#2FA5A9] text-white outline-none"
          />
          <button disabled={loading} className="px-8 py-3 rounded-lg bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 transition font-bold disabled:opacity-50">
            {loading ? "Submitting..." : "Request Channel"}
          </button>
        </form>

        <div className="space-y-6">
          {channels.map((c) => (
            <div key={c.streamKey} className="rounded-xl overflow-hidden bg-white/5 border border-[#2FA5A9] p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{c.name}</h3>
                <span className="flex items-center gap-2 text-[#2FA5A9] text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#2FA5A9] animate-pulse" />
                  LIVE READY
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">RTMP URL</p>
                  <div className="flex bg-black p-2 rounded border border-[#2FA5A9]">
                    <code className="flex-1 text-[#2FA5A9] truncate">rtmp://live.celeonetv.com/live</code>
                    <button onClick={() => copy("rtmp://live.celeonetv.com/live")}><FaCopy /></button>
                  </div>

                  <p className="text-xs text-gray-400 mt-4 mb-1">Stream Key</p>
                  <div className="flex bg-black p-2 rounded border border-[#2FA5A9]">
                    <code className="flex-1 text-yellow-400 truncate">{c.streamKey}</code>
                    <button onClick={() => copy(c.streamKey)}><FaCopy /></button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">HLS Link</p>
                  <div className="bg-black p-3 rounded border border-[#2FA5A9] text-xs text-[#2FA5A9] break-all">
                    https://live.celeonetv.com/hls/{c.streamKey}.m3u8
                  </div>
                  <button onClick={() => copy(`https://live.celeonetv.com/hls/${c.streamKey}.m3u8`)} className="mt-3 w-full py-2 bg-[#2FA5A9]/20 hover:bg-[#2FA5A9]/30 rounded">Copy HLS URL</button>
                </div>
              </div>

              {/* Add Podcast */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  placeholder="New Podcast"
                  value={podcastInput}
                  onChange={(e) => setPodcastInput(e.target.value)}
                  className="flex-1 p-2 rounded border border-[#2FA5A9] bg-black text-white outline-none"
                />
                <button onClick={() => addPodcast(c.id)} className="px-4 py-2 bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 rounded text-white font-bold">Add Podcast</button>
              </div>

              {/* Add Program */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  placeholder="New Program"
                  value={programInput}
                  onChange={(e) => setProgramInput(e.target.value)}
                  className="flex-1 p-2 rounded border border-[#2FA5A9] bg-black text-white outline-none"
                />
                <button onClick={() => addProgram(c.id)} className="px-4 py-2 bg-[#2FA5A9] hover:bg-[#2FA5A9]/90 rounded text-white font-bold">Add Program</button>
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
  const [role, setRole] = useState("user"); // default

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
        if (!snap.empty) setRole(snap.docs[0].data().role || "user");
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      <Navbar user={user} handleLogout={() => signOut(auth)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} isAdmin={role === "admin"} /> : <Login />} />
        <Route path="/request" element={user ? <Dashboard user={user} isAdmin={role === "admin"} /> : <Login />} />
      </Routes>
    </Router>
  );
}
