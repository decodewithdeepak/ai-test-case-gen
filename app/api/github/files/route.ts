import { NextRequest, NextResponse } from 'next/server';

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  size?: number;
  download_url?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  size?: number;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authorization.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const path = searchParams.get('path') || '';
    
    if (!repo) {
      return NextResponse.json({ error: 'Repository required' }, { status: 400 });
    }
    
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Test-Case-Generator'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    const files: GitHubFile[] = await response.json();
    
    // Convert GitHub API response to our FileNode format
    const fileNodes: FileNode[] = files
      .filter(file => {
        // Filter out common non-code directories and files
        const ignoredPaths = [
          '.git', 'node_modules', '.vscode', '.idea', 'build', 'dist', 
          'coverage', '.nyc_output', 'logs', '*.log', '.DS_Store',
          'Thumbs.db', '.env*', '*.min.js', '*.bundle.js'
        ];
        
        return !ignoredPaths.some(ignored => 
          file.name.startsWith(ignored.replace('*', '')) ||
          file.path.includes(`/${ignored}/`) ||
          (ignored.includes('*') && file.name.match(ignored.replace('*', '.*')))
        );
      })
      .map(file => ({
        name: file.name,
        path: file.path,
        type: file.type === 'file' ? 'file' : 'dir',
        size: file.size,
        children: file.type === 'dir' ? [] : undefined
      }))
      .sort((a, b) => {
        // Sort directories first, then files
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    
    return NextResponse.json(fileNodes);
    
  } catch (error) {
    console.error('GitHub files API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' }, 
      { status: 500 }
    );
  }
}