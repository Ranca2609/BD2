import React from 'react';

const Neo4jInterface = () => {
  return (
    <div style={{ width: '100%', height: '80vh', marginTop: '20px' }}>
      <iframe
        src="http://localhost:7474/browser/"
        title="Neo4j Browser"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
};

export default Neo4jInterface;
