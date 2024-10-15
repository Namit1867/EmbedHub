"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { FaFolder, FaFileAlt, FaFileWord, FaFilePdf, FaFilePowerpoint, FaFileImage, FaFileVideo } from "react-icons/fa";

const GoogleDriveDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStack, setFolderStack] = useState([]); // Tracks folder navigation
  const [currentFolder, setCurrentFolder] = useState("root");

  // Fetch Google Drive files from backend API
  const fetchDriveFiles = async (folderId = "root") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/drive?token=${session?.accessToken}&folderId=${folderId}`, {
        method: "GET",
      });
      if (response.status !== 200) handleDisconnect();
      const data = await response.json();
      setFiles(data.files);
      setCurrentFolder(folderId);
    } catch (error) {
      console.error("Error fetching Google Drive files", error);
    }
    setLoading(false);
  };

  // Handle folder navigation
  const handleFolderOpen = (folderId, folderName) => {
    setFolderStack([...folderStack, { id: folderId, name: folderName }]);
    fetchDriveFiles(folderId);
  };

  // Handle going back to previous folder
  const handleGoBack = () => {
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    fetchDriveFiles(newStack.length ? newStack[newStack.length - 1].id : "root");
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  // Fetch Google Drive files when user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchDriveFiles();
    } else {
      router.push("/");
    }
  }, [status]);

  const handleDisconnect = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem("session");
    router.push("/");
  };

  // Search files by name
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define icon types based on MIME types or file extensions
  const getFileIcon = (mimeType, fileName) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <FaFolder className="text-yellow-500" />;
    } else if (mimeType.includes("application/pdf")) {
      return <FaFilePdf className="text-red-500" />;
    } else if (mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") || mimeType.includes(".doc")) {
      return <FaFileWord className="text-blue-500" />;
    } else if (mimeType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation") || mimeType.includes(".ppt")) {
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
    <div className="min-h-screen flex flex-col items-center justify-center">
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
      <div className="w-3/4 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <h2 className="text-xl font-bold">Google Drive</h2>

          {/* Display folder path */}
          <div className="text-gray-600">
            {folderStack.length > 0 ? (
              <>
                Google Drive &gt;
                {folderStack.map((folder, index) => (
                  <span key={folder.id}>
                    {index > 0 && " > "}
                    {folder.name}
                  </span>
                ))}
              </>
            ) : (
              "Google Drive"
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* File List Table */}
        <div className="overflow-auto max-h-96">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Icon</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Owner</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className={`cursor-pointer transition hover:bg-gray-100 ${selectedFiles.includes(file.id)
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                    }`}
                  onDoubleClick={() =>
                    file.mimeType === "application/vnd.google-apps.folder"
                      ? handleFolderOpen(file.id, file.name)
                      : handleFileSelect(file.id)
                  }
                  onClick={() => handleFileSelect(file.id)} // Single click will still select the file
                >
                  <td className="px-4 py-2">{getFileIcon(file.mimeType, file.name)}</td>
                  <td className="px-4 py-2">{file.name}</td>
                  <td className="px-4 py-2">me</td>
                  <td className="px-4 py-2">{new Date(file.modifiedTime).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Back Button */}
        {folderStack.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
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
