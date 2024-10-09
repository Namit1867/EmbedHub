import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;   // Current page
  const perPage = searchParams.get('per_page') || 10; // Items per page

  try {
    const accessToken = session.accessToken; // GitHub access token

    // Fetch all repositories with pagination
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        visibility: 'all',
        affiliation: 'owner',
        page: page,
        per_page: perPage,
      },
    });

    // Return paginated data
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json({ error: 'Error fetching GitHub repositories' }, { status: 500 });
  }
}
