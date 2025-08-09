'use client';

import { useState, useEffect } from 'react';
import { GitHubAuth } from '@/components/github-auth';
import { RepoSelector } from '@/components/repo-selector';
import { FileTree } from '@/components/file-tree';
import { TestGenerator } from '@/components/test-generator';
import { ApiKeyModal } from '@/components/api-key-modal';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  language?: string;
  updated_at: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  selected?: boolean;
  content?: string;
}

export default function Home() {
  const [accessToken, setAccessToken] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('github_token');
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (token) {
      setAccessToken(token);
      fetchUser(token);
    }
    
    if (apiKey) {
      setGeminiApiKey(apiKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/github/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user data');
    }
  };

  const handleLogin = (token: string) => {
    setAccessToken(token);
    localStorage.setItem('github_token', token);
    fetchUser(token);
    toast.success('Successfully connected to GitHub!');
  };

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setFileTree([]);
    setSelectedFiles([]);
    toast.success(`Selected repository: ${repo.name}`);
  };

  const handleFilesLoad = (files: FileNode[]) => {
    setFileTree(files);
  };

  const handleFileSelection = (files: FileNode[]) => {
    setSelectedFiles(files);
  };

  const handleApiKeySet = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    localStorage.setItem('gemini_api_key', apiKey);
    setShowApiKeyModal(false);
    toast.success('Gemini API key configured!');
  };

  const isReady = accessToken && geminiApiKey && selectedRepo && selectedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Test Case Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Automatically generate comprehensive test cases for your GitHub repositories using AI
          </p>
        </header>

        <div className="space-y-8">
          {/* GitHub Authentication */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Connect to GitHub
            </h2>
            <GitHubAuth 
              onLogin={handleLogin} 
              user={user}
              accessToken={accessToken}
            />
          </div>

          {/* Repository Selection */}
          {accessToken && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Select Repository
              </h2>
              <RepoSelector
                accessToken={accessToken}
                onRepoSelect={handleRepoSelect}
                selectedRepo={selectedRepo}
              />
            </div>
          )}

          {/* File Selection */}
          {selectedRepo && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Select Files for Testing
              </h2>
              <FileTree
                repo={selectedRepo}
                accessToken={accessToken}
                onFilesLoad={handleFilesLoad}
                onFileSelection={handleFileSelection}
              />
            </div>
          )}

          {/* Test Generation */}
          {isReady && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Generate Test Cases
              </h2>
              <TestGenerator
                selectedFiles={selectedFiles}
                repository={selectedRepo}
                geminiApiKey={geminiApiKey}
                accessToken={accessToken}
              />
            </div>
          )}
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySet}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}