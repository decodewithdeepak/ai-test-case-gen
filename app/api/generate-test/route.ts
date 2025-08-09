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
    const { summary, files, repository, apiKey, accessToken } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key required' }, { status: 400 });
    }
    
    if (!summary || !files) {
      return NextResponse.json({ error: 'Summary and files required' }, { status: 400 });
    }
    
    // Get relevant files based on the summary
    const relevantFiles = files.filter((file: FileNode) => 
      summary.files.some((summaryFile: string) => 
        file.name === summaryFile || file.path.includes(summaryFile)
      )
    );
    
    // Fetch full content for relevant files
    const filesWithContent = await Promise.all(
      relevantFiles.map(async (file: FileNode) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/file-content?repo=${repository}&path=${file.path}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (response.ok) {
            const { content } = await response.json();
            return { ...file, content };
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
Generate comprehensive test code based on this summary:

Test Summary:
- Title: ${summary.title}
- Description: ${summary.description}  
- Framework: ${summary.framework}
- Test Type: ${summary.testType}
- Files to test: ${summary.files.join(', ')}

Source Code Files:
${filesWithContent.map(file => `
File: ${file.name} (${file.path})
${file.content || 'Content not available'}
`).join('\n')}

Generate a complete test file with:
1. Proper imports and setup for ${summary.framework}
2. Test suites organized by functionality
3. Individual test cases covering:
   - Happy path scenarios
   - Edge cases
   - Error handling
   - Input validation
4. Appropriate assertions and mocks
5. Good test naming conventions
6. Comments explaining complex test logic

Generate only the test code without any additional explanations or markdown formatting.
The code should be production-ready and follow best practices for ${summary.framework}.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const testCode = response.text();
    
    // Clean up the response (remove markdown formatting if present)
    const cleanCode = testCode
      .replace(/```[\w]*\n/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Generate appropriate filename
    const mainFile = summary.files[0] || 'test';
    const baseFilename = mainFile.split('.')[0];
    const extension = getTestFileExtension(summary.framework);
    const filename = `${baseFilename}.test${extension}`;
    
    const generatedTest = {
      id: summary.id,
      filename,
      content: cleanCode,
      framework: summary.framework
    };
    
    return NextResponse.json(generatedTest);
    
  } catch (error) {
    console.error('Generate test error:', error);
    return NextResponse.json(
      { error: 'Failed to generate test code' }, 
      { status: 500 }
    );
  }
}

function getTestFileExtension(framework: string): string {
  const extensionMap: { [key: string]: string } = {
    'Jest': '.js',
    'Vitest': '.js',
    'React Testing Library': '.jsx',
    'JUnit': '.java',
    'pytest': '.py',
    'Mocha': '.js',
    'Chai': '.js',
    'Jasmine': '.js',
    'Cypress': '.cy.js',
    'Playwright': '.spec.js'
  };
  
  return extensionMap[framework] || '.js';
}