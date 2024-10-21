"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaFolder,
  FaFileAlt,
  FaFileWord,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileImage,
  FaFileVideo,
  FaTrash,
} from "react-icons/fa";

const GoogleDriveDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [previousPageTokens, setPreviousPageTokens] = useState([]); // Track previous tokens for pagination
  const [loading, setLoading] = useState(false); // Loader state
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStack, setFolderStack] = useState([]); // Track folder navigation
  const [currentFolder, setCurrentFolder] = useState("root");
  const [selectedFiles, setSelectedFiles] = useState([]); // Track selected files

  // Fetch Google Drive files from backend API
  const fetchDriveFiles = async (folderId = "root", pageToken = "") => {
    setLoading(true); // Set loader to true before fetching
    try {
      const response = await fetch(
        `/api/drive?token=${session?.accessToken}&folderId=${folderId}&pageToken=${pageToken}`,
        {
          method: "GET",
        }
      );
      if (response.status !== 200) handleDisconnect();
      const data = await response.json();
      setFiles(data.files);
      setNextPageToken(data.nextPageToken || null);
      setCurrentFolder(folderId);
    } catch (error) {
      console.error("Error fetching Google Drive files", error);
    }
    setLoading(false); // Set loader to false after fetching
  };

  // Handle folder navigation (double-click to open folders)
  const handleFolderOpen = (folderId, folderName) => {
    setFolderStack([...folderStack, { id: folderId, name: folderName }]);
    setSearchQuery(""); // Clear the search query when a folder is opened
    fetchDriveFiles(folderId);
  };

  // Handle file selection (single click to select/deselect files)
  const handleFileSelect = (file) => {
    // Check if the file is a folder by checking its MIME type
    if (file.mimeType === "application/vnd.google-apps.folder") {
      return; // Do not select folders
    }

    const alreadySelected = selectedFiles.find(
      (selectedFile) => selectedFile.id === file.id
    );

    if (alreadySelected) {
      // Remove from selected files if already selected
      setSelectedFiles(
        selectedFiles.filter((selectedFile) => selectedFile.id !== file.id)
      );
    } else {
      // Add to selected files
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  // Handle removing a file from the selected list
  const handleRemoveFile = (fileId) => {
    setSelectedFiles(selectedFiles.filter((file) => file.id !== fileId));
  };

  // Handle going back to previous folder
  const handleGoBack = () => {
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    fetchDriveFiles(
      newStack.length ? newStack[newStack.length - 1].id : "root"
    );
  };

  // Handle pagination (Next)
  const handleNextPage = () => {
    if (nextPageToken) {
      setPreviousPageTokens([...previousPageTokens, nextPageToken]);
      fetchDriveFiles(currentFolder, nextPageToken);
    }
  };

  // Handle pagination (Previous)
  const handlePreviousPage = () => {
    if (previousPageTokens.length > 0) {
      const newTokens = previousPageTokens.slice(0, -1);
      setPreviousPageTokens(newTokens);
      const lastToken = newTokens[newTokens.length - 1] || "";
      fetchDriveFiles(currentFolder, lastToken);
    }
  };

  // Fetch Google Drive files when the user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchDriveFiles();
    } else {
      router.push("/");
    }
  }, [status]);

  // Handle logout
  const handleDisconnect = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem("session");
    router.push("/");
  };

  // Search files by name
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define file icons based on MIME types or file extensions
  const getFileIcon = (mimeType) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <FaFolder className="text-yellow-500" />;
    } else if (mimeType.includes("application/pdf")) {
      return <FaFilePdf className="text-red-500" />;
    } else if (
      mimeType.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) ||
      mimeType.includes(".doc")
    ) {
      return <FaFileWord className="text-blue-500" />;
    } else if (
      mimeType.includes(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) ||
      mimeType.includes(".ppt")
    ) {
      return <FaFilePowerpoint className="text-orange-500" />;
    } else if (mimeType.includes("image/")) {
      return <FaFileImage className="text-green-500" />;
    } else if (mimeType.includes("video/")) {
      return <FaFileVideo className="text-purple-500" />;
    } else {
      return <FaFileAlt className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      {/* Disconnect Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>

      {/* Google Drive File Picker */}
      <div className="w-full max-w-5xl dark:bg-[#1D1E21] rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-white ">
            Google Drive
          </h2>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid "></div>
          </div>
        )}

        {/* File List Table */}
        <div className="overflow-auto max-h-96">
          {!loading && (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200 dark:bg-[#191919] ">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Icon
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className={`cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      selectedFiles.find(
                        (selectedFile) => selectedFile.id === file.id
                      )
                        ? "bg-blue-50 dark:bg-gray-600 "
                        : ""
                    }`}
                    onClick={() => handleFileSelect(file)}
                    onDoubleClick={() =>
                      file.mimeType === "application/vnd.google-apps.folder"
                        ? handleFolderOpen(file.id, file.name)
                        : null
                    }
                  >
                    <td className="px-4 py-2">{getFileIcon(file.mimeType)}</td>
                    <td className="px-4 py-2">{file.name}</td>
                    <td className="px-4 py-2">
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Files Section */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-700">Selected Files</h3>
            <div className="flex flex-wrap mt-4">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg mr-2 mb-2"
                >
                  <span className="mr-2">{file.name}</span>
                  <FaTrash
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => handleRemoveFile(file.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={previousPageTokens.length === 0 || loading} // Disable when loading
            className={`px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition ${
              previousPageTokens.length === 0 || loading
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!nextPageToken || loading} // Disable when loading
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ${
              !nextPageToken || loading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            Next
          </button>
        </div>

        {/* Back Button (for folder navigation) */}
        {folderStack.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              disabled={loading} // Disable when loading
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDriveDashboard;
