'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Sparkles, 
  Code, 
  Copy, 
  Check,
  FileText,
  GitPullRequest,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

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

interface GeneratedTest {
  id: string;
  filename: string;
  content: string;
  framework: string;
}

interface TestGeneratorProps {
  selectedFiles: FileNode[];
  repository: any;
  geminiApiKey: string;
  accessToken: string;
}

export function TestGenerator({ selectedFiles, repository, geminiApiKey, accessToken }: TestGeneratorProps) {
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([]);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([]);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreatingPR, setIsCreatingPR] = useState(false);

  const generateTestSummaries = async () => {
    setIsGeneratingSummaries(true);
    try {
      const response = await fetch('/api/generate-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: selectedFiles,
          repository: repository.full_name,
          apiKey: geminiApiKey,
          accessToken
        }),
      });

      if (response.ok) {
        const summaries = await response.json();
        setTestSummaries(summaries);
        toast.success(`Generated ${summaries.length} test case summaries!`);
      } else {
        throw new Error('Failed to generate test summaries');
      }
    } catch (error) {
      console.error('Error generating summaries:', error);
      toast.error('Failed to generate test summaries');
    } finally {
      setIsGeneratingSummaries(false);
    }
  };

  const generateTestCode = async (summary: TestSummary) => {
    setIsGeneratingTest(summary.id);
    try {
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          files: selectedFiles,
          repository: repository.full_name,
          apiKey: geminiApiKey,
          accessToken
        }),
      });

      if (response.ok) {
        const generatedTest = await response.json();
        setGeneratedTests(prev => [...prev, generatedTest]);
        toast.success('Test code generated successfully!');
      } else {
        throw new Error('Failed to generate test code');
      }
    } catch (error) {
      console.error('Error generating test code:', error);
      toast.error('Failed to generate test code');
    } finally {
      setIsGeneratingTest(null);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const createPullRequest = async () => {
    if (generatedTests.length === 0) return;
    
    setIsCreatingPR(true);
    try {
      const response = await fetch('/api/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: repository.full_name,
          tests: generatedTests,
          accessToken
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Pull request created successfully! #${result.number}`);
        window.open(result.html_url, '_blank');
      } else {
        throw new Error('Failed to create pull request');
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      toast.error('Failed to create pull request');
    } finally {
      setIsCreatingPR(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Summaries */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Selected Files ({selectedFiles.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate AI-powered test case summaries for your selected files
          </p>
        </div>
        <Button
          onClick={generateTestSummaries}
          disabled={isGeneratingSummaries || selectedFiles.length === 0}
          className="px-6"
        >
          {isGeneratingSummaries ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isGeneratingSummaries ? 'Generating...' : 'Generate Test Summaries'}
        </Button>
      </div>

      {/* Selected Files Preview */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <Badge key={file.path} variant="secondary" className="text-xs">
              {file.name}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Test Summaries */}
      {testSummaries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Test Case Summaries ({testSummaries.length})
          </h3>
          
          <div className="grid gap-4">
            {testSummaries.map((summary) => {
              const isGenerating = isGeneratingTest === summary.id;
              const hasGenerated = generatedTests.some(t => t.id === summary.id);
              
              return (
                <Card key={summary.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {summary.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {summary.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">
                          {summary.framework}
                        </Badge>
                        <Badge variant="outline">
                          {summary.testType}
                        </Badge>
                        <Badge variant="secondary">
                          ~{summary.estimatedTests} tests
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Files: {summary.files.join(', ')}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => generateTestCode(summary)}
                      disabled={isGenerating || hasGenerated}
                      variant={hasGenerated ? "secondary" : "default"}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : hasGenerated ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Code className="w-4 h-4 mr-2" />
                      )}
                      {isGenerating ? 'Generating...' : hasGenerated ? 'Generated' : 'Generate Code'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Tests */}
      {generatedTests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Generated Test Code ({generatedTests.length})
            </h3>
            <Button
              onClick={createPullRequest}
              disabled={isCreatingPR}
              variant="outline"
            >
              {isCreatingPR ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitPullRequest className="w-4 h-4 mr-2" />
              )}
              {isCreatingPR ? 'Creating PR...' : 'Create Pull Request'}
            </Button>
          </div>
          
          <Tabs defaultValue={generatedTests[0]?.id} className="w-full">
            <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
              {generatedTests.map((test) => (
                <TabsTrigger key={test.id} value={test.id} className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{test.filename}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {generatedTests.map((test) => (
              <TabsContent key={test.id} value={test.id} className="mt-4">
                <Card>
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-2">
                      <Code className="w-4 h-4" />
                      <span className="font-medium">{test.filename}</span>
                      <Badge variant="secondary">{test.framework}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(test.content, test.id)}
                    >
                      {copiedCode === test.id ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copiedCode === test.id ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <pre className="p-4 text-sm bg-gray-50 dark:bg-gray-800 overflow-x-auto">
                      <code>{test.content}</code>
                    </pre>
                  </ScrollArea>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}