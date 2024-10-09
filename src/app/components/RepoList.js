'use client';
import { useState } from 'react';

const RepoList = ({ repositories, onSelectionChange }) => {
  const [selectedRepos, setSelectedRepos] = useState([]);

  const handleSelectionChange = (repo) => {
    const isSelected = selectedRepos.includes(repo);

    if (isSelected) {
      setSelectedRepos(selectedRepos.filter((r) => r !== repo));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }

    onSelectionChange(isSelected ? selectedRepos.filter((r) => r !== repo) : [...selectedRepos, repo]);
  };

  return (
    <div>
      <h2>Select Repositories</h2>
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
