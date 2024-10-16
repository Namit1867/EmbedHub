import { NextResponse } from "next/server";

// Google Drive Text Scraping Route
export async function POST(req) {
  const { fileIds, token } = await req.json();

  if (!fileIds || fileIds.length === 0) {
    return NextResponse.json({ error: "No file IDs provided" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Missing access token" }, { status: 400 });
  }

  const fileContents = [];

  for (const fileId of fileIds) {
    try {
      // Fetch file metadata to determine file type
      const metadataResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const metadata = await metadataResponse.json();

      if (metadata.mimeType.startsWith("application/vnd.google-apps.")) {
        // Handle Google Docs Editors files (e.g., Docs, Sheets, Slides)
        const exportMimeType = getExportMimeType(metadata.mimeType); // Function to get export type

        if (!exportMimeType) {
          throw new Error(`Unsupported Google Docs Editors file type: ${metadata.mimeType}`);
        }

        const exportResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMimeType}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!exportResponse.ok) {
          throw new Error(`Error exporting file ${fileId}: ${exportResponse.statusText}`);
        }

        const fileContent = await exportResponse.text();
        fileContents.push({ fileId, name: metadata.name, content: fileContent });
      } else {
        // Handle binary files (e.g., PDFs, text files)
        const binaryResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!binaryResponse.ok) {
          throw new Error(`Error fetching file ${fileId}: ${binaryResponse.statusText}`);
        }

        const fileContent = await binaryResponse.text();
        fileContents.push({ fileId, name: metadata.name, content: fileContent });
      }
    } catch (error) {
      console.error(`Error scraping file ${fileId}:`, error.message);
    }
  }

  return NextResponse.json({ files: fileContents });
}

// Helper function to determine the correct export MIME type for Google Docs Editors files
function getExportMimeType(mimeType) {
  switch (mimeType) {
    case "application/vnd.google-apps.document":
      return "text/plain"; // Google Docs -> Plain text
    case "application/vnd.google-apps.spreadsheet":
      return "text/csv"; // Google Sheets -> CSV
    case "application/vnd.google-apps.presentation":
      return "application/pdf"; // Google Slides -> PDF (no text export option)
    default:
      return null;
  }
}
