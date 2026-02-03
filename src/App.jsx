import React, { useState, useEffect } from 'react';
import './App.css'; // Ensure you have this file or use the style tag provided at the bottom

// --- Mock Data ---
const INITIAL_CHANNELS = [
  {
    id: 'ch1',
    name: 'Cèlè One',
    description: 'Chaîne de l\'ECC',
    ownerId: 'owner1',
    streamKey: '94eaea3845d04cf296f448337a663eb7',
    streamLink: 'https://live.celeonetv.com/hls/94eaea3845d04cf296f448337a663eb7.m3u8',
    isValidated: true,
    isLive: false,
    createdAt: '2026-01-25T01:30:50+01:00'
  }
];

// --- Components ---

// 1. Navigation Bar
const Navbar = ({ user, onLogin, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">CeleoneTV</div>
      <div className="nav-links">
        {user ? (
          <>
            <span>Hello, {user.name} ({user.role})</span>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => onLogin('admin')} className="btn-text">Admin Login</button>
            <button onClick={() => onLogin('owner')} className="btn-primary">Owner Login</button>
          </>
        )}
      </div>
    </nav>
  );
};

// 2. Live Player Component
const LivePlayer = ({ channel }) => {
  if (!channel) return <div className="player-placeholder">Select a channel to watch</div>;

  return (
    <div className="live-player-container">
      <div className="video-wrapper">
        {/* HLS.js would be loaded here in production. Using standard video tag for demo. */}
        <video 
          controls 
          autoPlay 
          width="100%" 
          height="100%"
          src={channel.streamLink}
          poster="https://via.placeholder.com/800x450?text=Live+Stream"
        >
          Your browser does not support the video tag.
        </video>
        <div className="live-badge">LIVE</div>
      </div>
      <div className="stream-details">
        <h2>{channel.name}</h2>
        <p>{channel.description}</p>
      </div>
    </div>
  );
};

// 3. Admin Dashboard
const AdminDashboard = ({ channels, onValidate, onAddProgram, onAddPodcast }) => {
  const [activeTab, setActiveTab] = useState('requests');
  
  const pendingChannels = channels.filter(c => !c.isValidated);
  const activeChannels = channels.filter(c => c.isValidated);

  const renderRequests = () => (
    <div className="card">
      <h3>Pending Requests</h3>
      {pendingChannels.length === 0 ? (
        <p className="text-muted">No pending requests.</p>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Channel Name</th>
              <th>Owner ID</th>
              <th>Stream Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingChannels.map(ch => (
              <tr key={ch.id}>
                <td>{ch.name}</td>
                <td>{ch.ownerId}</td>
                <td><code>{ch.streamKey}</code></td>
                <td>
                  <button onClick={() => onValidate(ch.id)} className="btn-success">Validate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const ContentForm = ({ type, onSubmit }) => (
    <div className="card">
      <h3>Add {type === 'program' ? 'Program' : 'Podcast'}</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        onSubmit({
          channelId: formData.get('channelId'),
          title: formData.get('title'),
          description: formData.get('description'),
          [type === 'program' ? 'schedule' : 'audioUrl']: formData.get(type === 'program' ? 'schedule' : 'audioUrl'),
          type
        });
        e.target.reset();
      }}>
        <div className="form-group">
          <label>Select Channel</label>
          <select name="channelId" required className="form-control">
            <option value="">Select...</option>
            {activeChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input name="title" type="text" required className="form-control" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" required className="form-control"></textarea>
        </div>
        {type === 'program' ? (
          <div className="form-group">
            <label>Schedule</label>
            <input name="schedule" type="text" placeholder="e.g. Fridays 8PM" required className="form-control" />
          </div>
        ) : (
          <div className="form-group">
            <label>Audio URL</label>
            <input name="audioUrl" type="url" required className="form-control" />
          </div>
        )}
        <button type="submit" className="btn-primary full-width">Add {type}</button>
      </form>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>Requests</button>
        <button className={activeTab === 'programs' ? 'active' : ''} onClick={() => setActiveTab('programs')}>Add Program</button>
        <button className={activeTab === 'podcasts' ? 'active' : ''} onClick={() => setActiveTab('podcasts')}>Add Podcast</button>
      </div>
      <div className="main-content">
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'programs' && <ContentForm type="program" onSubmit={onAddProgram} />}
        {activeTab === 'podcasts' && <ContentForm type="podcast" onSubmit={onAddPodcast} />}
      </div>
    </div>
  );
};

// 4. Channel Owner Dashboard
const OwnerDashboard = ({ channel, onToggleLive, onRecord }) => {
  if (!channel) return <div>Loading channel data...</div>;

  return (
    <div className="dashboard-container owner-view">
      <div className="card channel-status-card">
        <h2>{channel.name}</h2>
        <div className={`status-badge ${channel.isLive ? 'live' : 'offline'}`}>
          {channel.isLive ? '● LIVE' : '○ OFFLINE'}
        </div>
        <p>Stream Key: <code>{channel.streamKey}</code></p>
        <p>RTMP Link: <code>rtmp://live.celeonetv.com/live</code></p>
        
        <div className="action-buttons">
          <button 
            onClick={() => onToggleLive(channel.id)} 
            className={`btn-large ${channel.isLive ? 'btn-danger' : 'btn-success'}`}
          >
            {channel.isLive ? 'Stop Stream' : 'Go Live'}
          </button>
          
          <button 
            onClick={() => onRecord(channel.id)} 
            className="btn-large btn-record"
            disabled={!channel.isLive}
          >
            {channel.isRecording ? '● Stop Recording' : '● Start Recording'}
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3>Stream Stats</h3>
        <div className="stats-grid">
          <div>
            <span>Viewers</span>
            <strong>1,240</strong>
          </div>
          <div>
            <span>Bitrate</span>
            <strong>4500 kbps</strong>
          </div>
          <div>
            <span>FPS</span>
            <strong>60</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Landing Page
const LandingPage = ({ channels, programs, podcasts }) => {
  const featuredChannel = channels.find(c => c.isValidated) || channels[0];

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Experience Live TV Like Never Before</h1>
          <p>Stream, connect, and share your moments with the world.</p>
          <div className="hero-buttons">
            <button className="btn-primary btn-large">Get Started</button>
            <button className="btn-outline btn-large">Learn More</button>
          </div>
        </div>
      </section>

      <section className="live-section">
        <div className="container">
          <h2 className="section-title">Featured Channel</h2>
          <LivePlayer channel={featuredChannel} />
        </div>
      </section>

      <section className="content-grid-section">
        <div className="container">
          <div className="grid-split">
            <div>
              <h2>Programs</h2>
              <div className="content-list">
                {programs.length > 0 ? programs.map(p => (
                  <div key={p.id} className="content-item">
                    <h4>{p.title}</h4>
                    <p>{p.schedule}</p>
                  </div>
                )) : <p>No programs scheduled yet.</p>}
              </div>
            </div>
            <div>
              <h2>Podcasts</h2>
              <div className="content-list">
                {podcasts.length > 0 ? podcasts.map(p => (
                  <div key={p.id} className="content-item">
                    <h4>{p.title}</h4>
                    <p>{p.description}</p>
                  </div>
                )) : <p>No podcasts available yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [user, setUser] = useState(null); // null, { role: 'admin' }, { role: 'owner', id: 'owner1' }
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [programs, setPrograms] = useState([]);
  const [podcasts, setPodcasts] = useState([]);

  // Handlers
  const handleLogin = (role) => {
    if (role === 'owner') {
      setUser({ name: 'Joseph', role: 'owner', id: 'owner1' });
    } else {
      setUser({ name: 'Admin', role: 'admin' });
    }
  };

  const handleLogout = () => setUser(null);

  const handleValidateChannel = (id) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, isValidated: true } : ch));
  };

  const handleAddContent = (item, type) => {
    if (type === 'program') setPrograms([...programs, { ...item, id: Date.now() }]);
    else setPodcasts([...podcasts, { ...item, id: Date.now() }]);
  };

  const handleToggleLive = (id) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, isLive: !ch.isLive } : ch));
  };

  const handleRecord = (id) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, isRecording: !ch.isRecording } : ch));
  };

  // Router Logic
  const renderContent = () => {
    if (!user) {
      return <LandingPage channels={channels} programs={programs} podcasts={podcasts} />;
    }
    
    if (user.role === 'admin') {
      return (
        <AdminDashboard 
          channels={channels} 
          onValidate={handleValidateChannel}
          onAddProgram={(item) => handleAddContent(item, 'program')}
          onAddPodcast={(item) => handleAddContent(item, 'podcast')}
        />
      );
    }

    if (user.role === 'owner') {
      const myChannel = channels.find(ch => ch.ownerId === user.id);
      return (
        <OwnerDashboard 
          channel={myChannel} 
          onToggleLive={handleToggleLive}
          onRecord={handleRecord}
        />
      );
    }
  };

  return (
    <div className="App">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <main className="main-wrapper">
        {renderContent()}
      </main>
      <footer className="site-footer">
        <p>&copy; 2026 CeleoneTV. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
