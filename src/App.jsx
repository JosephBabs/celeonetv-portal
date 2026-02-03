// import React, { useState, useEffect } from 'react';
// import './App.css';

// // --- Mock Data ---
// const INITIAL_CHANNELS = [
//   {
//     id: 'ch1',
//     name: 'Cèlè One',
//     description: 'Chaîne de l\'ECC',
//     ownerId: 'owner1',
//     streamKey: '94eaea3845d04cf296f448337a663eb7',
//     streamLink: 'https://live.celeonetv.com/hls/94eaea3845d04cf296f448337a663eb7.m3u8',
//     isValidated: true,
//     isLive: false,
//     createdAt: '2026-01-25T01:30:50+01:00'
//   }
// ];

// // --- Components ---

// // 1. Navigation Bar
// const Navbar = ({ user, onLogin, onLogout }) => {
//   return (
//     <nav className="navbar">
//       <div className="nav-brand">Cele One</div>
//       <div className="nav-links">
//         {user ? (
//           <>
//             <span>Hello, {user.name} ({user.role})</span>
//             <button onClick={onLogout} className="btn-logout">Logout</button>
//           </>
//         ) : (
//           <>
//             <button onClick={() => onLogin('admin')} className="btn-text">Admin Login</button>
//             <button onClick={() => onLogin('owner')} className="btn-primary">Owner Login</button>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// };

// // 2. Live Player Component
// const LivePlayer = ({ channel }) => {
//   if (!channel) return <div className="player-placeholder">Select a channel to watch</div>;

//   return (
//     <div className="live-player-container">
//       <div className="video-wrapper">
//         <video 
//           controls 
//           autoPlay 
//           width="100%" 
//           height="100%"
//           src={channel.streamLink}
//           poster="https://via.placeholder.com/800x450?text=Live+Stream"
//         >
//           Your browser does not support the video tag.
//         </video>
//         <div className="live-badge">LIVE</div>
//       </div>
//       <div className="stream-details">
//         <h2>{channel.name}</h2>
//         <p>{channel.description}</p>
//       </div>
//     </div>
//   );
// };

// // 3. Admin Dashboard
// const AdminDashboard = ({ channels, onValidate, onAddProgram, onAddPodcast }) => {
//   const [activeTab, setActiveTab] = useState('requests');
  
//   const pendingChannels = channels.filter(c => !c.isValidated);
//   const activeChannels = channels.filter(c => c.isValidated);

//   const renderRequests = () => (
//     <div className="card">
//       <h3>Pending Requests</h3>
//       {pendingChannels.length === 0 ? (
//         <p className="text-muted">No pending requests.</p>
//       ) : (
//         <table className="styled-table">
//           <thead>
//             <tr>
//               <th>Channel Name</th>
//               <th>Owner ID</th>
//               <th>Stream Key</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {pendingChannels.map(ch => (
//               <tr key={ch.id}>
//                 <td>{ch.name}</td>
//                 <td>{ch.ownerId}</td>
//                 <td><code>{ch.streamKey}</code></td>
//                 <td>
//                   <button onClick={() => onValidate(ch.id)} className="btn-success">Validate</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );

//   const ContentForm = ({ type, onSubmit }) => (
//     <div className="card">
//       <h3>Add {type === 'program' ? 'Program' : 'Podcast'}</h3>
//       <form onSubmit={(e) => {
//         e.preventDefault();
//         const formData = new FormData(e.target);
//         onSubmit({
//           channelId: formData.get('channelId'),
//           title: formData.get('title'),
//           description: formData.get('description'),
//           [type === 'program' ? 'schedule' : 'audioUrl']: formData.get(type === 'program' ? 'schedule' : 'audioUrl'),
//           type
//         });
//         e.target.reset();
//       }}>
//         <div className="form-group">
//           <label>Select Channel</label>
//           <select name="channelId" required className="form-control">
//             <option value="">Select...</option>
//             {activeChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
//           </select>
//         </div>
//         <div className="form-group">
//           <label>Title</label>
//           <input name="title" type="text" required className="form-control" />
//         </div>
//         <div className="form-group">
//           <label>Description</label>
//           <textarea name="description" required className="form-control"></textarea>
//         </div>
//         {type === 'program' ? (
//           <div className="form-group">
//             <label>Schedule</label>
//             <input name="schedule" type="text" placeholder="e.g. Fridays 8PM" required className="form-control" />
//           </div>
//         ) : (
//           <div className="form-group">
//             <label>Audio URL</label>
//             <input name="audioUrl" type="url" required className="form-control" />
//           </div>
//         )}
//         <button type="submit" className="btn-primary full-width">Add {type}</button>
//       </form>
//     </div>
//   );

//   return (
//     <div className="dashboard-container">
//       <div className="sidebar">
//         <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>Requests</button>
//         <button className={activeTab === 'programs' ? 'active' : ''} onClick={() => setActiveTab('programs')}>Add Program</button>
//         <button className={activeTab === 'podcasts' ? 'active' : ''} onClick={() => setActiveTab('podcasts')}>Add Podcast</button>
//       </div>
//       <div className="main-content">
//         {activeTab === 'requests' && renderRequests()}
//         {activeTab === 'programs' && <ContentForm type="program" onSubmit={onAddProgram} />}
//         {activeTab === 'podcasts' && <ContentForm type="podcast" onSubmit={onAddPodcast} />}
//       </div>
//     </div>
//   );
// };

// // 4. Channel Owner Dashboard
// const OwnerDashboard = ({ channel, onToggleLive, onRecord }) => {
//   if (!channel) return <div>Loading channel data...</div>;

//   return (
//     <div className="dashboard-container owner-view">
//       <div className="card channel-status-card">
//         <h2>{channel.name}</h2>
//         <div className={`status-badge ${channel.isLive ? 'live' : 'offline'}`}>
//           {channel.isLive ? '● LIVE' : '○ OFFLINE'}
//         </div>
//         <p>Stream Key: <code>{channel.streamKey}</code></p>
//         <p>RTMP Link: <code>rtmp://live.celeonetv.com/live</code></p>
        
//         <div className="action-buttons">
//           <button 
//             onClick={() => onToggleLive(channel.id)} 
//             className={`btn-large ${channel.isLive ? 'btn-danger' : 'btn-success'}`}
//           >
//             {channel.isLive ? 'Stop Stream' : 'Go Live'}
//           </button>
          
//           <button 
//             onClick={() => onRecord(channel.id)} 
//             className="btn-large btn-record"
//             disabled={!channel.isLive}
//           >
//             {channel.isRecording ? '● Stop Recording' : '● Start Recording'}
//           </button>
//         </div>
//       </div>
      
//       <div className="card">
//         <h3>Stream Stats</h3>
//         <div className="stats-grid">
//           <div>
//             <span>Viewers</span>
//             <strong>1,240</strong>
//           </div>
//           <div>
//             <span>Bitrate</span>
//             <strong>4500 kbps</strong>
//           </div>
//           <div>
//             <span>FPS</span>
//             <strong>60</strong>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // 5. Landing Page
// const LandingPage = ({ channels, programs, podcasts }) => {
//   const featuredChannel = channels.find(c => c.isValidated) || channels[0];

//   return (
//     <div className="landing-page">
//       <section className="hero-section">
//         <div className="hero-content">
//           <h1>Cele One</h1>
//           <div className="hero-description">
//             <p>
//               Cele One is a digital platform built to unite members of the Celestial Church of Christ worldwide.
//             </p>
//             <p>
//               The app provides access to church news, official documents, community discussions, and multimedia content, creating a shared space for information, fellowship, and spiritual growth.
//             </p>
//             <p>
//               By bringing Celestials together across borders, Cele One strengthens faith, promotes unity, and supports active participation in church life — anytime, anywhere.
//             </p>
//           </div>
//           <div className="hero-buttons">
//             <button className="btn-primary btn-large">Join Community</button>
//             <button className="btn-outline btn-large">Learn More</button>
//           </div>
//         </div>
//       </section>

//       <section className="live-section">
//         <div className="container">
//           <h2 className="section-title">Featured Channel</h2>
//           <LivePlayer channel={featuredChannel} />
//         </div>
//       </section>

//       <section className="content-grid-section">
//         <div className="container">
//           <div className="grid-split">
//             <div>
//               <h2>Programs</h2>
//               <div className="content-list">
//                 {programs.length > 0 ? programs.map(p => (
//                   <div key={p.id} className="content-item">
//                     <h4>{p.title}</h4>
//                     <p>{p.schedule}</p>
//                   </div>
//                 )) : <p>No programs scheduled yet.</p>}
//               </div>
//             </div>
//             <div>
//               <h2>Podcasts</h2>
//               <div className="content-list">
//                 {podcasts.length > 0 ? podcasts.map(p => (
//                   <div key={p.id} className="content-item">
//                     <h4>{p.title}</h4>
//                     <p>{p.description}</p>
//                   </div>
//                 )) : <p>No podcasts available yet.</p>}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// // --- Main App Component ---
// function App() {
//   const [user, setUser] = useState(null); 
//   const [channels, setChannels] = useState(INITIAL_CHANNELS);
//   const [programs, setPrograms] = useState([]);
//   const [podcasts, setPodcasts] = useState([]);

//   // Handlers
//   const handleLogin = (role) => {
//     if (role === 'owner') {
//       setUser({ name: 'Joseph', role: 'owner', id: 'owner1' });
//     } else {
//       setUser({ name: 'Admin', role: 'admin' });
//     }
//   };

//   const handleLogout = () => setUser(null);

//   const handleValidateChannel = (id) => {
//     setChannels(channels.map(ch => ch.id === id ? { ...ch, isValidated: true } : ch));
//   };

//   const handleAddContent = (item, type) => {
//     if (type === 'program') setPrograms([...programs, { ...item, id: Date.now() }]);
//     else setPodcasts([...podcasts, { ...item, id: Date.now() }]);
//   };

//   const handleToggleLive = (id) => {
//     setChannels(channels.map(ch => ch.id === id ? { ...ch, isLive: !ch.isLive } : ch));
//   };

//   const handleRecord = (id) => {
//     setChannels(channels.map(ch => ch.id === id ? { ...ch, isRecording: !ch.isRecording } : ch));
//   };

//   // Router Logic
//   const renderContent = () => {
//     if (!user) {
//       return <LandingPage channels={channels} programs={programs} podcasts={podcasts} />;
//     }
    
//     if (user.role === 'admin') {
//       return (
//         <AdminDashboard 
//           channels={channels} 
//           onValidate={handleValidateChannel}
//           onAddProgram={(item) => handleAddContent(item, 'program')}
//           onAddPodcast={(item) => handleAddContent(item, 'podcast')}
//         />
//       );
//     }

//     if (user.role === 'owner') {
//       const myChannel = channels.find(ch => ch.ownerId === user.id);
//       return (
//         <OwnerDashboard 
//           channel={myChannel} 
//           onToggleLive={handleToggleLive}
//           onRecord={handleRecord}
//         />
//       );
//     }
//   };

//   return (
//     <div className="App">
//       <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
//       <main className="main-wrapper">
//         {renderContent()}
//       </main>
//       <footer className="site-footer">
//         <p>&copy; 2026 Cele One. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// }

// export default App;



import React, { useState, useEffect } from 'react';
import './App.css';

// --- Mock Data ---
const INITIAL_CHANNELS = [
  {
    id: 'ch1',
    name: 'Cèlè One',
    description: "Chaîne de l'ECC",
    ownerId: 'owner1',
    streamKey: '94eaea3845d04cf296f448337a663eb7',
    streamLink: 'https://live.celeonetv.com/hls/94eaea3845d04cf296f448337a663eb7.m3u8',
    isValidated: true,
    isLive: false,
    createdAt: '2026-01-25T01:30:50+01:00'
  }
];

// Mock user database
const USER_DATA = [
  { userId: 'owner1', username: 'joseph', password: '1234', role: 'owner' },
  { userId: 'admin1', username: 'admin', password: 'admin', role: 'admin' },
];

// --- Components ---

// 1. Navbar
const Navbar = ({ user, onLogout }) => (
  <nav className="navbar">
    <div className="nav-brand">Cele One</div>
    <div className="nav-links">
      {user ? (
        <>
          <span>Hello, {user.username} ({user.role})</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </>
      ) : null}
    </div>
  </nav>
);

// 2. Live Player
const LivePlayer = ({ channel }) => {
  if (!channel) return <div className="player-placeholder">Select a channel to watch</div>;

  return (
    <div className="live-player-container">
      <div className="video-wrapper">
        <video 
          controls 
          autoPlay 
          width="100%" 
          height="100%"
          src={channel.streamLink}
          poster="https://via.placeholder.com/800x450?text=Live+Stream"
        />
        {channel.isLive && <div className="live-badge">LIVE</div>}
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
      {pendingChannels.length === 0 ? <p className="text-muted">No pending requests.</p> : (
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
          <input name="title" type="text" required className="form-control"/>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" required className="form-control"></textarea>
        </div>
        {type === 'program' ? (
          <div className="form-group">
            <label>Schedule</label>
            <input name="schedule" type="text" placeholder="e.g. Fridays 8PM" required className="form-control"/>
          </div>
        ) : (
          <div className="form-group">
            <label>Audio URL</label>
            <input name="audioUrl" type="url" required className="form-control"/>
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
        {activeTab === 'programs' && <ContentForm type="program" onSubmit={onAddProgram}/>}
        {activeTab === 'podcasts' && <ContentForm type="podcast" onSubmit={onAddPodcast}/>}
      </div>
    </div>
  );
};

// 4. Owner Dashboard
const OwnerDashboard = ({ channel, programs, podcasts, onToggleLive, onRecord }) => {
  if (!channel) return <div>Loading channel data...</div>;

  const userPrograms = programs.filter(p => p.channelId === channel.id);
  const userPodcasts = podcasts.filter(p => p.channelId === channel.id);

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
        <h3>Previous Programs</h3>
        {userPrograms.length > 0 ? (
          <ul>
            {userPrograms.map(p => <li key={p.id}>{p.title} — {p.schedule}</li>)}
          </ul>
        ) : <p>No programs added yet.</p>}
      </div>

      <div className="card">
        <h3>Previous Podcasts</h3>
        {userPodcasts.length > 0 ? (
          <ul>
            {userPodcasts.map(p => <li key={p.id}>{p.title} — {p.description}</li>)}
          </ul>
        ) : <p>No podcasts added yet.</p>}
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
          <h1>Cele One</h1>
          <p className="hero-description">
            Unite members of the Celestial Church of Christ worldwide.
          </p>
        </div>
      </section>
      <section className="live-section">
        <div className="container">
          <h2>Featured Channel</h2>
          <LivePlayer channel={featuredChannel} />
        </div>
      </section>
    </div>
  );
};

// 6. Login Form
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USER_DATA.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/>
        <button type="submit" className="btn-primary full-width">Login</button>
        {error && <p className="text-error">{error}</p>}
      </form>
    </div>
  );
};

// --- Main App ---
function App() {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [programs, setPrograms] = useState([]);
  const [podcasts, setPodcasts] = useState([]);

  const handleLogin = (user) => setUser(user);
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

  const renderContent = () => {
    if (!user) return <LoginForm onLogin={handleLogin} />;
    
    const userChannel = channels.find(ch => ch.ownerId === user.userId);

    return (
      <div>
        {user.role === 'admin' && (
          <AdminDashboard 
            channels={channels} 
            onValidate={handleValidateChannel} 
            onAddProgram={(item) => handleAddContent(item, 'program')}
            onAddPodcast={(item) => handleAddContent(item, 'podcast')}
          />
        )}
        {userChannel && (
          <OwnerDashboard 
            channel={userChannel} 
            programs={programs} 
            podcasts={podcasts} 
            onToggleLive={handleToggleLive}
            onRecord={handleRecord}
          />
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-wrapper">
        {renderContent()}
      </main>
      <footer className="site-footer">
        <p>&copy; 2026 Cele One. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
