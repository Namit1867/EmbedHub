import { NextResponse } from "next/server";
import JSZip from "jszip";

// Google Drive Download Route
export async function POST(req: Request) {
  const { fileIds, token } = await req.json();
  const zip = new JSZip();

  if (!fileIds || !token) {
    return NextResponse.json({ error: "Missing file IDs or token" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  try {
    for (const fileId of fileIds) {
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers }
      );
      if (!fileResponse.ok) {
        throw new Error(`Error downloading file: ${fileId}`);
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const fileName = fileResponse.headers.get("Content-Disposition")
        ? fileResponse.headers.get("Content-Disposition").split("filename=")[1].replace(/"/g, "")
        : `file_${fileId}`;

      // Add file to the zip
      zip.file(fileName, fileBuffer);
    }

    // Generate the zip
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Set response headers for downloading the zip file
    const headers = new Headers({
      "Content-Disposition": "attachment; filename=google_drive_files.zip",
      "Content-Type": "application/zip",
    });

    return new Response(zipBuffer, { headers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
