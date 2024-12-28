import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [searchName, setSearchName] = useState('');
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreatePerson = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/graph/node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: parseInt(age, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(data.message);
      setError(null);
      setName('');
      setAge('');
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  const handleMatchPerson = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/graph/match?name=${encodeURIComponent(
          searchName
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(JSON.stringify(data.result, null, 2));
      setError(null);
      setSearchName('');
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  const handleCreateRelationship = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/graph/relationship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName,
          toName,
          type: relationshipType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuccess(JSON.stringify(data, null, 2));
      setError(null);
      setFromName('');
      setToName('');
      setRelationshipType('');
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  // Estilos actualizados
  const mainContainerStyle = {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#1a1a1a',
    margin: 0,
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
  };

  const cardStyle = {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    margin: '20px',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    marginBottom: '10px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '4px',
    color: '#ffffff',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  };

  const sectionStyle = {
    marginBottom: '25px',
  };

  const messageStyle = (isError) => ({
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '4px',
    backgroundColor: isError ? '#fee2e2' : '#dcfce7',
    color: isError ? '#dc2626' : '#16a34a',
    whiteSpace: 'pre-wrap',
  });

  const titleStyle = {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '24px',
  };

  const codeBlockStyle = {
    backgroundColor: '#1a1a1a',
    padding: '10px',
    borderRadius: '4px',
    overflowX: 'auto',
    border: '1px solid #404040',
    marginTop: '10px',
  };

  return (
    <div style={mainContainerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Neo4j API Interface</h1>

        {error && <div style={messageStyle(true)}>{error}</div>}
        {success && (
          <div style={codeBlockStyle}>
            <pre style={{ margin: 0, color: '#ffffff' }}>{success}</pre>
          </div>
        )}

        <div style={sectionStyle}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Create Person</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleCreatePerson} style={buttonStyle}>
            Create Person
          </button>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Find Person</h2>
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleMatchPerson} style={buttonStyle}>
            Find Person
          </button>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Create Relationship</h2>
          <input
            type="text"
            placeholder="From Name"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="To Name"
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Relationship Type (e.g., FRIEND_OF)"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleCreateRelationship} style={buttonStyle}>
            Create Relationship
          </button>
        </div>

        <div style={sectionStyle}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Neo4j Browser</h2>
          <p style={{ color: '#a0aec0' }}>
            Access the Neo4j Browser at:{' '}
            <a
              href="http://localhost:7474/browser/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              http://localhost:7474/browser/
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;