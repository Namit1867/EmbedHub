"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import JSZip from 'jszip';
import { set } from "zod";
import { FaTrash } from "react-icons/fa";

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [repositories, setRepositories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [owner, setOwner] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [scraping, setScraping] = useState(false);
  const [filesData, setFilesData] = useState<any[]>([]); // Array to store file data
  const [selectedFileExtensions, setSelectedFileExtensions] = useState<string[]>([]); // Selected file extensions for filtering
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]); // Selected files for embedding
  const [embedding, setEmbedding] = useState(false);

  // Extract file extensions from filesData
  const getFileExtensions = () => {
    const extensions = filesData.map((file) => {
      const ext = file.path.split('.').pop(); // Get file extension
      return ext || ''; // Return extension or empty string if no extension found
    });
    return Array.from(new Set(extensions)); // Remove duplicates
  };

  // Handle file extension filter selection
  const handleFilterChange = (extension: string) => {
    if (selectedFileExtensions.includes(extension)) {
      setSelectedFileExtensions(selectedFileExtensions.filter((ext) => ext !== extension));
    } else {
      setSelectedFileExtensions([...selectedFileExtensions, extension]);
    }
  };

  // Handle file selection for embedding
  const handleFileSelection = (file: any) => {
    if (selectedFiles.includes(file)) {
      setSelectedFiles(selectedFiles.filter((selectedFile) => selectedFile !== file));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  // Filter files based on selected extensions
  const filteredFiles = filesData.filter((file) => {
    if (selectedFileExtensions.length === 0) return true;
    const ext = file.path.split('.').pop();
    return selectedFileExtensions.includes(ext);
  });

  // Fetch GitHub repositories
  const fetchRepositories = async (page: number) => {
    try {
      const response = await fetch(`https://api.github.com/user/repos?per_page=10&page=${page}&type=owner`, {
        headers: { Authorization: `token ${session?.accessToken}` },
      });
      if (response.status != 200) handleDisconnect();
      const data = await response.json();
      setRepositories(data);
    } catch (error) {
      console.error("Error fetching repositories:", error);
    }
  };

  // Parse GitHub repository URL
  function parseRepoUrl(url) {
    url = url.replace(/\/$/, '');
    const urlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/tree\/([^\/]+)(\/(.+))?)?$/;
    const match = url.match(urlPattern);
    if (!match) throw new Error('Invalid GitHub repository URL.');
    return { owner: match[1], repo: match[2], refFromUrl: match[4], pathFromUrl: match[6] };
  }

  // Fetch branches for the selected repository
  const fetchBranches = async (repoObj: { html_url: any; }) => {
    try {
      const { owner, repo } = parseRepoUrl(repoObj.html_url);
      setOwner(owner);
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
        headers: { Authorization: `token ${session?.accessToken}` },
      });
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  // Handle repository selection
  const handleRepoSelect = (repo: { html_url: any; }) => {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    setFilesData([]); // Reset files data when a new repo is selected
    fetchBranches(repo);
  };

  // Handle scraping content
  const handleScrape = async () => {
    setScraping(true);
    setFilesData([]);

    const repoUrl = selectedRepo.html_url;
    const { owner, repo } = parseRepoUrl(repoUrl);

    const response = await fetch('/api/scrape-github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedRepos: [selectedRepo], token: session?.accessToken, owner: owner, repo: selectedRepo.name, branch: selectedBranch }),
    });

    if (response.ok) {
      const data = await response.json();
      setFilesData(data.filesData); // Set the file data array from the response
    } else {
      console.error("Error scraping repository content");
    }

    setScraping(false);
  };

  // Handle embedding content
  const handleCreateEmbeddings = async (text,file_name) => {
    setEmbedding(true);

    const response = await fetch('/api/create-embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, provider: "github", namespace: `${owner}/${selectedRepo?.name}/${selectedBranch}/${file_name}`, resourceId: `github/${owner}/${selectedRepo?.name}` }),
    });

    if (response.ok) {
      console.log("Embeddings created and stored in Pinecone");
    } else {
      console.error("Error creating embeddings");
    }

    setEmbedding(false);
  };

  // Handle pagination
  const handleNextPage = () => {
    setPage((prev) => prev + 1);
    fetchRepositories(page + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
      fetchRepositories(page - 1);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") fetchRepositories(1);
  }, [status]);

  const handleDisconnect = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem("session");
    router.push("/");
  };

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex">
      <div className="w-1/3 p-6 bg-gray-100 relative">
        {/* Sidebar */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Disconnect
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">GitHub Repositories</h2>

        {/* Access Token */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800">Access Token</label>
          <div className="relative mt-2">
            <input
              type="text"
              value={session?.accessToken || ""}
              disabled
              className="block w-full pl-4 pr-12 py-3 rounded-lg bg-gray-100 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ease-in-out sm:text-base"
            />
          </div>
        </div>

        {/* Repositories List */}
        <div className="mb-6">
          <ul className="mt-3 border border-gray-300 rounded-lg divide-y divide-gray-200 h-60 overflow-y-scroll shadow-lg">
            {repositories.map((repo) => (
              <li
                key={repo.id}
                onClick={() => handleRepoSelect(repo)}
                className={`p-4 cursor-pointer flex items-center justify-between transition duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-50 ${selectedRepo?.name === repo.name
                    ? "bg-blue-50 border-l-4 border-blue-500 shadow-md scale-105"
                    : ""
                  }`}
              >
                <span className="font-medium text-gray-800">{repo.name}</span>
                {selectedRepo?.name === repo.name && (
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className={`px-5 py-2 rounded-lg transition duration-300 transform hover:scale-105 focus:outline-none ${page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400 hover:text-black"
              }`}
          >
            Previous
          </button>
          <span className="text-gray-600">Page {page}</span>
          <button
            onClick={handleNextPage}
            className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 hover:text-black transition duration-300 transform hover:scale-105 focus:outline-none"
          >
            Next
          </button>
        </div>

        {/* Branch Selection */}
        {selectedRepo && (
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800">Select Branch</label>
            <select
              onChange={(e) => setSelectedBranch(e.target.value)}
              value={selectedBranch || ""}
              className="mt-2 block w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ease-in-out"
            >
              <option value="" disabled>
                Select a branch
              </option>
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main content section */}
      <div className="w-2/3 p-6 bg-gray-200">
        <h2 className="text-2xl font-bold mb-6">Repository Content</h2>

        {/* Display file extensions as filters */}
        <div className="mb-6">
          <h3 className="text-lg font-bold">Filter by File Type:</h3>
          <div className="flex space-x-4 mt-2">
            {getFileExtensions().map((ext, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={selectedFileExtensions.includes(ext)}
                  onChange={() => handleFilterChange(ext)}
                />
                <span className="text-gray-600">{ext}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedRepo && selectedBranch ? (
          <div>
            <p>
              <strong>Repository:</strong> {selectedRepo.name}
            </p>
            <p>
              <strong>Branch:</strong> {selectedBranch}
            </p>

            <button
              onClick={handleScrape}
              className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition ${scraping ? "opacity-50 cursor-not-allowed" : ""
                }`}
              disabled={scraping}
            >
              {scraping ? "Scraping..." : "Scrape Repository"}
            </button>

            {/* Scraped file content display with custom styling and scrollable textarea */}
            {filesData.length > 0 && (
              <div className="mt-6 p-4 bg-white rounded-md shadow">
                {filesData.map((file, index) => (
                  <div key={index} className="mb-6">
                    {/* File Header: Icon, Name, and Delete */}
                    <div className="flex justify-between items-center mb-2">
                      {/* File Name */}
                      <div className="flex items-center">
                        <h4 className="text-xl font-bold text-gray-600 ml-2">
                          {file.path}
                        </h4>
                      </div>
                    </div>

                    {/* Text area for file content with increased height and scrollable view */}
                    <div className="bg-white p-4 border rounded-lg max-h-96 overflow-auto">
                      <textarea
                        className="w-full h-64 border-none focus:outline-none"
                        value={file.text} // Replace with `file.content` if needed
                        onChange={(e) => {
                          const newFilesData = [...filesData];
                          newFilesData[index].text = e.target.value;
                          setFilesData(newFilesData);
                        }}
                      />
                    </div>

                    {/* Create Embeddings Button */}
                    <button
                      onClick={() => handleCreateEmbeddings(file.text,file.path)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Create Embeddings
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : (
          <p>Please select a repository and branch to view the content.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
