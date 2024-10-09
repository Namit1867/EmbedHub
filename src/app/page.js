'use client';

import { useEffect, useState } from 'react';
import RepoList from './components/RepoList';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);

  useEffect(() => {
    // Fetch repositories from the API
    fetch('/api/github-repos')
      .then((res) => res.json())
      .then((data) => setRepositories(data));
  }, []);

  const handleRepoSelectionChange = (selected) => {
    setSelectedRepos(selected);
  };

  const handleProceedWithScraping = async () => {
    const accessToken = session.accessToken; // GitHub access token
  
    const response = await fetch('/api/scrape-github-repos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedRepos, token: accessToken }),
    });
  
    const data = await response.json();
  
    if (data.error) {
      console.error(data.error);
      return;
    }
  
    // Safely check if the outputText element exists
    const outputTextArea = document.getElementById('outputText');
    if (outputTextArea) {
      // Show formatted text in a text area
      outputTextArea.value = data.formattedText;
    } else {
      console.error('Text area with id "outputText" not found.');
    }
  
    // // Download the ZIP file
    // const blob = new Blob([data.zipContent], { type: 'application/zip' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'repository_contents.zip';
    // a.click();
    // URL.revokeObjectURL(url);
  };
  

  return (
    <div>
      <h1>GitHub Repository Selector</h1>
      {repositories.length > 0 ? (
        <>
          <RepoList repositories={repositories} onSelectionChange={handleRepoSelectionChange} />
          <button onClick={handleProceedWithScraping} disabled={selectedRepos.length === 0}>
            Proceed with Scraping Data
          </button>
        </>
      ) : (
        <p>Loading repositories...</p>
      )}

      <style jsx>{`
        button {
          padding: 10px 20px;
          margin-top: 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>

      <textarea id="outputText" style={{ width: '100%', height: '200px' }}></textarea>

    </div>
    
  );
}
