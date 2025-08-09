import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authorization.replace('Bearer ', '');
    
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Test-Case-Generator'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    
    const repos = await response.json();
    return NextResponse.json(repos);
    
  } catch (error) {
    console.error('GitHub repositories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' }, 
      { status: 500 }
    );
  }
}