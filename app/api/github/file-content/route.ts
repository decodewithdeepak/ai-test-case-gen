import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authorization.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const path = searchParams.get('path');
    
    if (!repo || !path) {
      return NextResponse.json({ error: 'Repository and path required' }, { status: 400 });
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
      throw new Error('Failed to fetch file content');
    }
    
    const fileData = await response.json();
    
    if (fileData.type !== 'file') {
      return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
    }
    
    // Decode base64 content
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    
    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('GitHub file content API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file content' }, 
      { status: 500 }
    );
  }
}