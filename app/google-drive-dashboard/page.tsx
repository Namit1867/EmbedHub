"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaFolder,
  FaFileAlt,
  FaFileWord,
  FaFileCsv,
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
  const [scrapingLoader, setScrapingLoader] = useState(false); // Loader for scraping
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStack, setFolderStack] = useState([]); // Track folder navigation
  const [currentFolder, setCurrentFolder] = useState("root");
  const [selectedFiles, setSelectedFiles] = useState([]); // Track selected files
  const [scrapedContent, setScrapedContent] = useState([]); // Track scraped content
  const [showScrapedContent, setShowScrapedContent] = useState(false); // To toggle scraped content panel
  const [scrapeButtonLoading, setScrapeButtonLoading] = useState(false); // Loader state for Scrape button


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
    if (
      file.mimeType === "application/vnd.google-apps.folder" ||
      file.mimeType.includes("image/") ||
      file.mimeType.includes("video/") ||
      file.mimeType.includes("application/pdf") ||
      file.mimeType.includes(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      )
    ) {
      return; // Do not select folders, images, videos, PDFs, and PowerPoints
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
    // Filter out the file with the matching fileId from the scrapedContent array
    setSelectedFiles(selectedFiles.filter((file) => file.id !== fileId));
  };
  
  // Handle removing a file from the selected list
  const handleRemoveScrapedFile = (fileId) => {
    // Filter out the file with the matching fileId from the scrapedContent array
    setScrapedContent(scrapedContent.filter((file) => file.fileId !== fileId));
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

// Function to scrape content from selected files
const scrapeTextFromSelectedFiles = async () => {
  setScrapeButtonLoading(true); // Start loader for the Scrape button
  setScrapingLoader(true); // Start loader for the scraping process

  const fileIds = selectedFiles.map((file) => file.id);

  const response = await fetch("/api/scrape-google-drive-file", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileIds, token: session?.accessToken }),
  });

  if (response.ok) {
    const data = await response.json();
    setScrapedContent((prevContent) => [...prevContent, ...data.files]);
    setShowScrapedContent(true); // Show the scraped content panel
    setSelectedFiles([]); // Clear selected files
  } else {
    console.error("Error scraping text data");
  }

  setScrapingLoader(false); // Stop loader for the scraping process
  setScrapeButtonLoading(false); // Stop loader for the Scrape button
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
      ) || mimeType.includes(".doc")
    ) {
      return <FaFileWord className="text-blue-500" />;
    } else if (
      mimeType.includes("application/vnd.google-apps.spreadsheet") ||
      mimeType.includes(".csv")
    ) {
      return <FaFileCsv className="text-green-500" />;
    } else if (mimeType.includes("presentation") || mimeType.includes(".pptx")) {
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
    <div className="min-h-screen flex">
      {/* Google Drive File Picker (Left Side) */}
      <div
        className={`bg-white p-6 shadow-lg transition-all duration-500 ease-in-out ${
          showScrapedContent ? "w-2/3" : "w-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700">Google Drive</h2>

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
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid border-gray-200"></div>
          </div>
        )}

        {/* File List Table */}
        <div className="overflow-auto max-h-96">
          {!loading && (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
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
                    className={`cursor-pointer transition hover:bg-gray-100 ${
                      selectedFiles.find(
                        (selectedFile) => selectedFile.id === file.id
                      )
                        ? "bg-blue-50"
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
                  className="flex items-center bg-gray-200 px-4 py-2 rounded-lg mr-2 mb-2"
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
              !nextPageToken || loading
                ? "cursor-not-allowed opacity-50"
                : ""
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


{/* Scraped Content Panel (Right Side) */}
{showScrapedContent && (
  <div className="w-1/3 bg-gray-50 p-6 shadow-lg overflow-y-auto h-screen">
    <h3 className="text-2xl font-bold text-gray-700 mb-4">
      Scraped Content
    </h3>
    
    {scrapedContent.map((file, index) => (
      <div key={index} className="mb-6">
        <div className="flex justify-between items-center mb-2">
          {/* File Type Icon and File Name */}
          <div className="flex items-center">
            {getFileIcon(file.mimeType)} {/* Display File Type Icon */}
            <h4 className="text-xl font-bold text-gray-600 ml-2">
              {file.name}
            </h4>
          </div>
          {/* Trash Can Icon to Remove Specific File */}
          <FaTrash
            className="text-red-500 cursor-pointer hover:text-red-700"
            onClick={() => handleRemoveScrapedFile(file.fileId)} // Delete only the clicked file
          />
        </div>
        {/* Increased height for the text area and scrollable */}
        <div className="bg-white p-4 border rounded-lg max-h-96 overflow-auto">
          <textarea
            className="w-full h-64 border-none focus:outline-none"
            value={file.content}
            onChange={(e) => {
              const newContent = [...scrapedContent];
              newContent[index].content = e.target.value;
              setScrapedContent(newContent);
            }}
          />
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Create Embeddings
        </button>
      </div>
    ))}

    {/* Loader below last file when new files are being selected */}
    {scrapingLoader && (
      <div className="flex justify-center mt-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid"></div>
        <span className="ml-2 text-gray-700">Scraping new content...</span>
      </div>
    )}
  </div>
)}

      {/* Scrape Button */}
      {!!selectedFiles.length && (
  <div className="absolute bottom-4 right-4">
    <button
      onClick={scrapeTextFromSelectedFiles}
      disabled={scrapeButtonLoading} // Disable button while loading
      className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition ${scrapeButtonLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {scrapeButtonLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-white border-solid mr-2"></div>
          Scraping...
        </div>
      ) : (
        "Scrape Content"
      )}
    </button>
  </div>
)}
    </div>
  );
};

export default GoogleDriveDashboard;
