import { NextResponse } from "next/server";

// Google Drive Files Fetching Route
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing access token" }, { status: 400 });
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType)",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error fetching files: ${data.error}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
