import { NextResponse } from 'next/server';
import JSZip from 'jszip';

// Parse GitHub repository URL
function parseRepoUrl(url) {
  url = url.replace(/\/$/, '');
  const urlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/tree\/([^\/]+)(\/(.+))?)?$/;
  const match = url.match(urlPattern);
  if (!match) {
    throw new Error('Invalid GitHub repository URL.');
  }
  return {
    owner: match[1],
    repo: match[2],
    refFromUrl: match[4], // Branch or tag if specified in URL
    pathFromUrl: match[6], // Path if specified in URL
  };
}

// Fetch default branch of the repository
async function fetchDefaultBranch(owner, repo, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: token ? `token ${token}` : '',
  };
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to fetch repository details: ${response.status}`);
  const data = await response.json();
  return data.default_branch;
}

// Fetch repository SHA
async function fetchRepoSha(owner, repo, ref, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path ? `${path}` : ''}${ref ? `?ref=${ref}` : ''}`;
  const headers = {
    'Accept': 'application/vnd.github.object+json',
    Authorization: token ? `token ${token}` : '',
  };
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to fetch repository SHA: ${response.status}`);
  const data = await response.json();
  return data.sha;
}

// Fetch repository tree
async function fetchRepoTree(owner, repo, sha, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    Authorization: token ? `token ${token}` : '',
  };
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to fetch repository tree: ${response.status}`);
  const data = await response.json();
  return data.tree;
}

// Fetch file contents
async function fetchFileContents(files, token) {
  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    Authorization: token ? `token ${token}` : '',
  };
  const contents = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(file.url, { headers });
      if (!response.ok) throw new Error(`Failed to fetch file contents: ${response.status}`);
      const text = await response.text();
      return { url: file.url, path: file.path, text };
    })
  );
  return contents;
}

// Create and download a zip file
async function createAndDownloadZip(repoContents) {
  const zip = new JSZip();

  repoContents.forEach(({ repoName, fileContents }) => {
    const folder = zip.folder(repoName); // Create folder for each repo in the zip
    fileContents.forEach((file) => {
      const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      folder.file(filePath, file.text); // Add files under the repo folder
    });
  });

  return await zip.generateAsync({ type: 'blob' });
}

// API route handler
export async function POST(request) {
  try {
    const { selectedRepos, token } = await request.json();

    if (!selectedRepos || selectedRepos.length === 0) {
      throw new Error('No repositories selected.');
    }

    const repoResults = [];

    // Loop through each selected repository and scrape it
    for (const repoObj of selectedRepos) {
      const repoUrl = repoObj.html_url;
      const { owner, repo, refFromUrl, pathFromUrl } = parseRepoUrl(repoUrl);

      // Fetch the default branch if no branch is specified in the URL
      const defaultBranch = refFromUrl || await fetchDefaultBranch(owner, repo, token);

      // Fetch the SHA and tree structure of the repository
      const sha = await fetchRepoSha(owner, repo, defaultBranch, pathFromUrl, token);
      const tree = await fetchRepoTree(owner, repo, sha, token);

      // Filter out files (for example, select all files)
      const selectedFiles = tree.filter((item) => item.type === 'blob');

      // Fetch the contents of selected files
      const fileContents = await fetchFileContents(
        selectedFiles.map((file) => ({
          path: file.path,
          url: `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
        })),
        token
      );

      // Collect results for this repository
      repoResults.push({
        repoName: repo,
        fileContents,
      });
    }

    // Format all file contents into a single text output
    const formattedText = repoResults
      .map(({ repoName, fileContents }) =>
        fileContents.map((file) => `Repository: ${repoName}\nFile: ${file.path}\n\n${file.text}`).join('\n\n')
      )
      .join('\n\n');

    // Generate ZIP file with all repositories' content
    const zip = await createAndDownloadZip(repoResults);

    // Return formatted text and ZIP content
    return NextResponse.json({
      formattedText,
      zipContent: zip, // You can send this in a different format if needed
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
