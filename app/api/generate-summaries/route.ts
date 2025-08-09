import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
}

interface TestSummary {
  id: string;
  title: string;
  description: string;
  framework: string;
  testType: string;
  estimatedTests: number;
  files: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { files, repository, apiKey, accessToken } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key required' }, { status: 400 });
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    // Fetch file contents
    const filesWithContent = await Promise.all(
      files.map(async (file: FileNode) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/file-content?repo=${repository}&path=${file.path}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (response.ok) {
            const { content } = await response.json();
            return { ...file, content: content.slice(0, 2000) }; // Limit content for AI
          }
          return file;
        } catch (error) {
          console.error(`Error fetching content for ${file.path}:`, error);
          return file;
        }
      })
    );
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Analyze these code files and generate test case summaries. Return a JSON array of test summaries.

Files to analyze:
${filesWithContent.map(file => `
File: ${file.name} (${file.path})
${file.content ? `Content preview:\n${file.content}` : 'Content not available'}
`).join('\n')}

For each logical group of related files or significant individual files, create a test summary with:
- id: unique identifier (use kebab-case)
- title: descriptive test suite title
- description: what the tests will cover (2-3 sentences)
- framework: appropriate testing framework (Jest, Vitest, JUnit, pytest, etc.)
- testType: type of testing (unit, integration, e2e, etc.)
- estimatedTests: estimated number of test cases
- files: array of file names that will be tested

Consider the programming language, existing patterns, and typical testing approaches.
Aim for 2-4 comprehensive test summaries that cover the key functionality.

Return only valid JSON without any additional text or markdown formatting.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const summaries = JSON.parse(text) as TestSummary[];
      return NextResponse.json(summaries);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const summaries = JSON.parse(jsonMatch[0]) as TestSummary[];
        return NextResponse.json(summaries);
      }
      
      throw new Error('Invalid JSON response from AI');
    }
    
  } catch (error) {
    console.error('Generate summaries error:', error);
    return NextResponse.json(
      { error: 'Failed to generate test summaries' }, 
      { status: 500 }
    );
  }
}