'use client';
import { useState, useEffect } from 'react';

const RepoList = ({ repositories, onSelectionChange, selectedRepos }) => {
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);

  useEffect(() => {
    setSelectedRepoIds(selectedRepos.map(repo => repo.id)); // Sync selected repositories
  }, [selectedRepos]);

  const handleSelectionChange = (repo) => {
    const isSelected = selectedRepoIds.includes(repo.id);
    const updatedSelection = isSelected
      ? selectedRepos.filter(r => r.id !== repo.id)
      : [...selectedRepos, repo];

    setSelectedRepoIds(updatedSelection.map(repo => repo.id));
    onSelectionChange(updatedSelection);
  };

  return (
    <div>
      <h2>Select Github Repositories</h2>
      <ul>
        {repositories.map((repo) => (
          <li key={repo.id} className="repo-item">
            <div>
              <input
                type="checkbox"
                onChange={() => handleSelectionChange(repo)}
                checked={selectedRepos.includes(repo)}
              />
              <span>
                <strong>{repo.name}</strong> - {repo.description || 'No description provided'}
              </span>
            </div>
            <div>
              <span>Language: {repo.language || 'Unknown'}</span> | 
              <span>Created on: {new Date(repo.created_at).toLocaleDateString()}</span>
            </div>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              View Repository
            </a>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .repo-item {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          margin-bottom: 10px;
          list-style-type: none;
        }
        a {
          color: blue;
          text-decoration: underline;
        }
        a:hover {
          color: darkblue;
        }
      `}</style>
    </div>
  );
};

export default RepoList;
