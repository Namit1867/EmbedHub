# EmbedHubs

A powerful Next.js application that enables seamless content extraction and AI processing from GitHub repositories and Google Drive files. EmbedHub provides intuitive dashboards for browsing, selecting, and scraping content, then generates embeddings for advanced content analysis.

## Features

### 🔗 Multi-Platform Integration
- **GitHub Integration**: Browse repositories, select branches, and extract file contents [1](#0-0) 
- **Google Drive Integration**: Navigate folders, select files, and scrape document content [2](#0-1) 

### 📊 Interactive Dashboards
- **GitHub Dashboard**: Repository browsing with file type filtering and batch processing [3](#0-2) 
- **Google Drive Dashboard**: Folder navigation with MIME type detection and file selection [4](#0-3) 

### 🤖 AI-Powered Processing
- Content scraping with intelligent file type handling
- Embeddings generation using Pinecone vector database [5](#0-4) 
- LangChain integration for advanced text processing [6](#0-5) 

### 🔐 Secure Authentication
- OAuth integration with NextAuth.js [7](#0-6) 
- Token-based API access for external services

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: NextAuth.js with OAuth providers
- **AI/ML**: LangChain, Pinecone Vector Database
- **File Processing**: JSZip for archive creation [8](#0-7) 
- **UI Components**: Radix UI primitives with custom styling

## API Endpoints

### Content Scraping
- `GET /api/drive` - Fetch Google Drive file listings [9](#0-8) 
- `POST /api/scrape-google-drive-file` - Extract content from Google Drive files [10](#0-9) 
- `POST /api/scrape-github` - Scrape GitHub repository content [11](#0-10) 

### File Type Support

#### Google Drive
- Google Docs (exported as plain text) [12](#0-11) 
- Google Sheets (exported as CSV) [13](#0-12) 
- Microsoft Word documents
- Binary files with text extraction

#### GitHub
- All text-based file formats
- Intelligent filtering of binary files [14](#0-13) 
- Branch-specific content extraction

## Getting Started

### Prerequisites
- Node.js 18+
- Google Drive API credentials
- GitHub API token
- Pinecone API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Namit1867/EmbedHub.git
cd EmbedHub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Configure your API keys and OAuth credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### GitHub Workflow
1. Navigate to `/github-dashboard`
2. Select a repository from your accessible repos
3. Choose a branch for content extraction
4. Filter files by extension using the checkbox filters [15](#0-14) 
5. Scrape repository content and generate embeddings

### Google Drive Workflow
1. Navigate to `/google-drive-dashboard`
2. Browse folders using the navigation interface
3. Select compatible files (docs, sheets, etc.) [16](#0-15) 
4. Scrape selected content and process with AI

## Architecture

EmbedHub follows a modular architecture with clear separation between frontend dashboards, backend APIs, and external service integrations. The application uses OAuth for secure authentication and provides real-time feedback during content processing operations.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```

## Notes

The codebase shows a well-structured Next.js application with comprehensive file type handling, OAuth authentication, and AI integration. The application name in `package.json` is currently "github-google-drive-integration" [17](#0-16)  but the repository is named EmbedHub, suggesting the project may have evolved from its original scope. The README reflects the current functionality based on the actual implementation rather than the package name.



Wiki pages you might want to explore:
- [User Interfaces (Namit1867/EmbedHub)](/wiki/Namit1867/EmbedHub#2)
- [Content Scraping APIs (Namit1867/EmbedHub)](/wiki/Namit1867/EmbedHub#3.1)
