// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { FaPlay,  FaUser, FaVideo, FaCopy } from 'react-icons/fa';

// --- Components ---

const Navbar = ({ user, handleLogout }) => (
  <nav className="fixed top-0 w-full z-50 bg-brand-dark/90 backdrop-blur-md border-b border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold text-white tracking-tighter">
            Celeone<span className="text-brand-accent">TV</span>
          </Link>
        </div>
        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm hidden md:block">Hi, {user.email}</span>
              <button onClick={handleLogout} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-brand-accent hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/30">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Home = () => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
    {/* Background Gradients */}
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-brand-dark to-brand-dark -z-10"></div>
    
    <div className="text-center px-4 max-w-4xl mx-auto pt-20">
      <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold">
        Next Gen Streaming Platform
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
        Broadcast your <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Vision Live</span>
      </h1>
      <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10">
        Professional grade streaming infrastructure. Create channels, generate keys, and stream to the world in seconds.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/request" className="flex items-center gap-2 bg-white text-brand-dark px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105">
          <FaVideo /> Create Channel
        </Link>
        <Link to="/login" className="flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-700 transition-all border border-gray-700">
          <FaUser /> Broadcaster Login
        </Link>
      </div>
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark pt-16">
      <div className="bg-brand-light p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Sign in to manage your streams</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Email Address</label>
            <input 
              type="email" 
              className="w-full p-3 rounded-lg bg-brand-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
              placeholder="broadcaster@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 rounded-lg bg-brand-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/25">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "channels"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const channelsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChannels(channelsData);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };
    fetchChannels();
  }, [user]);

  const createChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setLoading(true);

    try {
      const streamKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      await addDoc(collection(db, "channels"), {
        channelName: newChannelName.trim(),
        streamKey: streamKey,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // Update local state immediately
      setChannels([...channels, {
        channelName: newChannelName.trim(),
        streamKey: streamKey,
        userId: user.uid,
        createdAt: new Date()
      }]);
      
      setNewChannelName('');
    } catch (err) {
      console.error("Error creating channel: ", err);
      alert("Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-brand-dark pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Manage your streaming channels</p>
          </div>
        </div>
        
        {/* Create Channel Form */}
        <div className="bg-brand-light p-6 rounded-xl shadow-lg border border-gray-700 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <FaVideo className="text-brand-accent" /> Create New Channel
          </h2>
          <form onSubmit={createChannel} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Channel Name (e.g. my-live-show)" 
              className="flex-1 p-3 rounded-lg bg-brand-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </form>
        </div>

        {/* Channels List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Channels</h2>
          {channels.length === 0 ? (
            <div className="text-center py-12 bg-brand-light rounded-xl border border-dashed border-gray-700">
              <p className="text-gray-500">No channels found. Create one above to start streaming.</p>
            </div>
          ) : (
            channels.map(channel => (
              <div key={channel.id} className="bg-brand-light rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{channel.channelName}</h3>
                    <span className="text-xs text-gray-500 font-mono">ID: {channel.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-400/10 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    READY
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* OBS Settings */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">OBS / Encoder Settings</h4>
                    
                    <div className="mb-4">
                      <label className="block text-gray-500 text-xs mb-1">Stream URL (RTMP)</label>
                      <div className="flex items-center bg-brand-dark p-3 rounded-lg border border-gray-700">
                        <code className="text-sm text-blue-400 flex-1 truncate">rtmp://live.celeonetv.com/live</code>
                        <button onClick={() => copyToClipboard('rtmp://live.celeonetv.com/live')} className="text-gray-400 hover:text-white ml-2">
                          <FaCopy />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-500 text-xs mb-1">Stream Key</label>
                      <div className="flex items-center bg-brand-dark p-3 rounded-lg border border-gray-700">
                        <code className="text-sm text-yellow-400 flex-1 truncate font-mono">{channel.streamKey}</code>
                        <button onClick={() => copyToClipboard(channel.streamKey)} className="text-gray-400 hover:text-white ml-2">
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Viewer Link */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Viewer Link (HLS)</h4>
                    <div className="bg-brand-dark p-4 rounded-lg border border-gray-700 h-full flex flex-col justify-center">
                      <div className="flex items-center mb-2">
                        <FaPlay className="text-brand-accent mr-2" />
                        <span className="text-sm text-gray-400">Direct Stream URL:</span>
                      </div>
                      <div className="flex items-center bg-gray-900 p-2 rounded border border-gray-600">
                        <code className="text-xs text-blue-300 break-all">
                          https://live.celeonetv.com/hls/{channel.streamKey}.m3u8
                        </code>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(`https://live.celeonetv.com/hls/${channel.streamKey}.m3u8`)}
                        className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <Router>
      <div className="font-sans antialiased text-gray-100 min-h-screen flex flex-col">
        <Navbar user={user} handleLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/request" element={user ? <Dashboard user={user} /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
