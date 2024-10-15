import { NextResponse } from "next/server";

// Google Drive Files Fetching Route
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const folderId = searchParams.get("folderId");
  const pageToken = searchParams.get("pageToken") || ""; // Add pageToken for pagination

  if (!token) {
    return NextResponse.json({ error: "Missing access token" }, { status: 400 });
  }

  let query = `q='${folderId}' in parents`; // By default, fetch files from the folder

  if (folderId === "root") {
    // Modify the query to also include files shared with the user
    query = `q='${folderId}' in parents or sharedWithMe=true`;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${query}&pageSize=100&fields=nextPageToken,files(id,name,mimeType,modifiedTime)&pageToken=${pageToken}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error fetching files: ${data.error.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
