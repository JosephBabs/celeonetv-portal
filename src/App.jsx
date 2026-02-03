import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ channels, onValidateChannel, onAddProgram, onAddPodcast }) => {
  const [pendingChannels, setPendingChannels] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'programs', 'podcasts'

  // Separate pending channels from active ones
  useEffect(() => {
    setPendingChannels(channels.filter(ch => !ch.isValidated));
  }, [channels]);

  // --- Handlers ---

  const handleValidate = (channelId) => {
    if (window.confirm('Are you sure you want to validate this channel?')) {
      onValidateChannel(channelId);
    }
  };

  const handleAddProgram = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProgram = {
      channelId: formData.get('channelId'),
      title: formData.get('title'),
      description: formData.get('description'),
      schedule: formData.get('schedule'),
      type: 'program'
    };
    onAddProgram(newProgram);
    e.target.reset();
    alert('Program added successfully!');
  };

  const handleAddPodcast = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPodcast = {
      channelId: formData.get('channelId'),
      title: formData.get('title'),
      description: formData.get('description'),
      audioUrl: formData.get('audioUrl'),
      type: 'podcast'
    };
    onAddPodcast(newPodcast);
    e.target.reset();
    alert('Podcast added successfully!');
  };

  // --- Render Helpers ---

  const renderRequests = () => (
    <div className="admin-section">
      <h2>Pending Channel Requests</h2>
      {pendingChannels.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Description</th>
              <th>Stream Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingChannels.map((channel) => (
              <tr key={channel.id || channel.streamKey}>
                <td>{channel.name}</td>
                <td>{channel.ownerId}</td>
                <td>{channel.description}</td>
                <td>{channel.streamKey}</td>
                <td>
                  <button 
                    className="btn-validate" 
                    onClick={() => handleValidate(channel.id || channel.streamKey)}
                  >
                    Validate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderProgramForm = () => (
    <div className="admin-section">
      <h2>Add Program</h2>
      <form onSubmit={handleAddProgram}>
        <div className="form-group">
          <label>Select Channel:</label>
          <select name="channelId" required>
            <option value="">Select a validated channel...</option>
            {channels.filter(ch => ch.isValidated).map(ch => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Program Title:</label>
          <input type="text" name="title" required />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea name="description" required />
        </div>
        <div className="form-group">
          <label>Schedule (e.g., Mon 20:00):</label>
          <input type="text" name="schedule" required />
        </div>
        <button type="submit">Add Program</button>
      </form>
    </div>
  );

  const renderPodcastForm = () => (
    <div className="admin-section">
      <h2>Add Podcast</h2>
      <form onSubmit={handleAddPodcast}>
        <div className="form-group">
          <label>Select Channel:</label>
          <select name="channelId" required>
            <option value="">Select a validated channel...</option>
            {channels.filter(ch => ch.isValidated).map(ch => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Podcast Title:</label>
          <input type="text" name="title" required />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea name="description" required />
        </div>
        <div className="form-group">
          <label>Audio URL:</label>
          <input type="url" name="audioUrl" required />
        </div>
        <button type="submit">Add Podcast</button>
      </form>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-nav">
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
        <button 
          className={activeTab === 'programs' ? 'active' : ''} 
          onClick={() => setActiveTab('programs')}
        >
          Add Program
        </button>
        <button 
          className={activeTab === 'podcasts' ? 'active' : ''} 
          onClick={() => setActiveTab('podcasts')}
        >
          Add Podcast
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'programs' && renderProgramForm()}
        {activeTab === 'podcasts' && renderPodcastForm()}
      </div>
    </div>
  );
};

export default AdminDashboard;
