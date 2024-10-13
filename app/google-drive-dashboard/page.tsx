"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";

const GoogleDriveDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Google Drive files from backend API
  const fetchDriveFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/drive?token=${session?.accessToken}`, {
        method: "GET"
      });
      if (response.status !== 200) handleDisconnect();
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error("Error fetching Google Drive files", error);
    }
    setLoading(false);
  };

  // Handle file selection (multiple select)
  const handleFileSelect = (fileId) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  // Handle file download (ZIP selected files)
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/drive/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileIds: selectedFiles, token: session.accessToken }),
      });
      const zipBlob = await response.blob();

      // Create a download link for the zip file
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.setAttribute("download", "google_drive_files.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading files", error);
    }
    setDownloading(false);
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

  if (loading) return <div>Loading files from Google Drive...</div>;

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
        <h2 className="text-xl font-bold mb-4">Select a file</h2>

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
                <th className="px-4 py-2 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Owner</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className={`cursor-pointer transition hover:bg-gray-100 ${
                    selectedFiles.includes(file.id)
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                  onClick={() => handleFileSelect(file.id)}
                >
                  <td className="px-4 py-2">{file.name}</td>
                  <td className="px-4 py-2">me</td>
                  <td className="px-4 py-2">{new Date().toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Select and Cancel Buttons */}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={handleDownload}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition ${
              downloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={downloading || selectedFiles.length === 0}
          >
            {downloading ? "Downloading..." : "Select"}
          </button>
          <button
            onClick={() => setSelectedFiles([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveDashboard;
