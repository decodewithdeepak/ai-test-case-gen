# AI Test Case Generator

Automatically generate comprehensive test cases for your GitHub repositories using AI.

## Features

- **GitHub Authentication:** Connect your GitHub account using a personal access token.
- **Repository Selection:** Browse and select repositories from your GitHub account.
- **File Tree View:** Explore and select files/folders for which you want to generate tests.
- **AI-Powered Test Generation:** Uses Google Gemini API to generate test case summaries and full test code for selected files.
- **Test Code Preview & Copy:** View generated test code and copy it to your clipboard.
- **Pull Request Creation:** Automatically create a pull request with the generated tests in your repository.
- **Modern UI:** Built with Next.js, React, Tailwind CSS, and shadcn/ui components.

## Technologies Used

- **Next.js (App Router)**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Google Gemini API**
- **GitHub REST API**

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A GitHub personal access token
- A Google Gemini API key

### Installation

```bash
git clone https://github.com/decodewithdeepak/ai-test-case-gen.git
cd ai-test-case-gen
npm install
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect to GitHub:** Enter your GitHub personal access token to authenticate.
2. **Configure Gemini API Key:** Enter your Google Gemini API key.
3. **Select Repository:** Choose a repository from your GitHub account.
4. **Select Files:** Browse the file tree and select files for which you want to generate tests.
5. **Generate Test Cases:** Click to generate AI-powered test case summaries and code.
6. **Create Pull Request:** Optionally, create a pull request with the generated tests.

## Project Structure

- `app/` - Next.js app directory (API routes, pages, layout)
- `components/` - React components (UI, authentication, repo selector, file tree, test generator, etc.)
- `hooks/` - Custom React hooks
- `lib/` - Utility functions
- `public/` - Static assets
- `styles/` - Global styles

## API Endpoints

- `POST /api/generate-summaries` - Generate test case summaries for selected files.
- `POST /api/generate-test` - Generate test code for a given summary.
- `POST /api/create-pr` - Create a pull request with generated tests.
- `GET /api/github/user` - Get authenticated GitHub user info.
- `GET /api/github/repositories` - List user repositories.
- `GET /api/github/files` - List files in a repository.
- `GET /api/github/file-content` - Get file content from a repository.

## Credits

- [shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini API](https://ai.google.dev/)
- [GitHub REST API](https://docs.github.com/en/rest)
