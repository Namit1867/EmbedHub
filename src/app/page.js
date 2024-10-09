'use client';

import { useState, useEffect } from 'react';
import RepoList from './components/RepoList';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [googleDriveFiles, setGoogleDriveFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);  // Tracks if there are more repos to fetch
  const perPage = 10; // Number of repositories per page
  const [isGitHubConnected, setIsGitHubConnected] = useState(false); // Track GitHub connection
  const [isGoogleConnected, setIsGoogleConnected] = useState(false); // Track Google Drive connection

  // Fetch GitHub repositories
  useEffect(() => {
    if (isGitHubConnected && session?.accessToken) {
      fetchRepositories();
    }
  }, [page, query, isGitHubConnected]);

  // Check if user is connected to GitHub or Google Drive
  useEffect(() => {
    if (!!session) {
      // Check if GitHub or Google Drive is connected
      setIsGitHubConnected(session.provider === "github");
      setIsGoogleConnected(session.provider === "google");
    }
  }, [session]);

  // Fetch Github Repositories
  const fetchRepositories = async () => {
    setLoading(true);

    const response = await fetch(`/api/github-repos?page=${page}&per_page=${perPage}&query=${query}`);
    const data = await response.json();

    if (data.error) {
      console.error(data.error);
    } else {
      setRepositories(data);

      // If no repositories are returned, disable the "Next" button
      if (data.length === 0) {
        setHasMore(false);  // No more repositories to fetch
      } else {
        setHasMore(true);   // There are more repositories to fetch
      }
    }

    setLoading(false);
  };

  // Fetch Google Drive files
  const fetchGoogleDriveFiles = async () => {
    setLoading(true);
    const response = await fetch('/api/google-drive-files');
    const data = await response.json();

    if (data.error) {
      console.error(data.error);
    } else {
      setGoogleDriveFiles(data.files);
    }

    setLoading(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && hasMore) { // Only allow page change if more repos exist
      setPage(newPage);
    }
  };

  const handleRepoSelectionChange = (updatedSelection) => {
    setSelectedRepos(updatedSelection); // Persist selected repos across pages
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
  };

  // Handle disconnect from GitHub and go back to option selection
  const handleGoBack = () => {
    signOut();
    setIsGitHubConnected(false);
    setIsGoogleConnected(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Select Repositories and Google Drive Files to Scrape</h1>

      {/* GitHub Section */}
      {isGitHubConnected ? (
        <>
          <button onClick={handleGoBack} style={styles.goBackButton}>Go Back</button>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <RepoList
              repositories={repositories}
              onSelectionChange={handleRepoSelectionChange}
              selectedRepos={selectedRepos}
              style={styles.repoList}
            />
          )}

          {/* Pagination Buttons */}
          <div style={styles.pagination}>
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading} style={styles.button}>
              Previous
            </button>
            <span style={styles.pageNumber}>Page {page}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={!hasMore || loading} style={styles.button}>
              Next
            </button>
          </div>
        </>
      ) : !isGoogleConnected ? (
        <>
          <button onClick={() => signIn('github')} style={styles.connectButton}>Connect to GitHub</button>
          <button onClick={() => signIn('google')} style={styles.connectButton}>Connect to Google Drive</button>
        </>
      ) : null}

      {/* Google Drive Section */}
      {isGoogleConnected && !isGitHubConnected ? (
        <>
          <button onClick={handleGoBack} style={styles.goBackButton}>Go Back</button>
          <button onClick={fetchGoogleDriveFiles} style={styles.button}>Fetch Google Drive Files</button>

          <ul style={styles.fileList}>
            {googleDriveFiles.map((file) => (
              <li key={file.id} style={styles.fileItem}>{file.name}</li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Selected Repositories */}
      <h2 style={styles.subTitle}>Selected Repositories:</h2>
      <ul style={styles.repoList}>
        {selectedRepos.map(repo => (
          <li key={repo.id} style={styles.repoItem}>{repo.name}</li>
        ))}
      </ul>

      {/* Proceed to Scrape Button */}
      <button onClick={handleProceedWithScraping} disabled={selectedRepos.length === 0} style={styles.scrapeButton}>
        Proceed with Scraping
      </button>

      <textarea id="outputText" style={styles.textArea}></textarea>
    </div>
  );
}

// Inline CSS Styles
const styles = {
  container: {
    width: '80%',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
  },
  subTitle: {
    fontSize: '1.5em',
    color: '#333',
    marginTop: '20px',
  },
  connectButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  goBackButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#ff6347',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  button: {
    margin: '10px',
    padding: '10px 20px',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
  },
  pageNumber: {
    fontSize: '1.2em',
    margin: '0 20px',
  },
  repoList: {
    listStyleType: 'none',
    padding: 0,
  },
  repoItem: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    marginBottom: '10px',
  },
  fileList: {
    listStyleType: 'none',
    padding: 0,
  },
  fileItem: {
    padding: '10px',
    borderBottom: '1px solid #ddd',
    marginBottom: '10px',
  },
  scrapeButton: {
    display: 'block',
    margin: '20px auto',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  textArea: {
    width: '100%',
    height: '200px',
    marginTop: '20px',
    padding: '10px',
    fontSize: '1em',
    borderRadius: '5px',
    border: '1px solid #ddd',
  }
};
