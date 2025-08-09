'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Github, User, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GitHubAuthProps {
  onLogin: (token: string) => void;
  user: any;
  accessToken: string;
}

export function GitHubAuth({ onLogin, user, accessToken }: GitHubAuthProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTokenLogin = async () => {
    if (!token.trim()) return;
    
    setIsLoading(true);
    try {
      // Validate token by making a test API call
      const response = await fetch('/api/github/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        onLogin(token);
        setToken('');
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user && accessToken) {
    return (
      <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {user.login}
                </span>
                <Badge variant="outline" className="text-xs">
                  {user.name || 'GitHub User'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connected to GitHub
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Github className="w-4 h-4" />
        <span>Enter your GitHub Personal Access Token</span>
      </div>
      
      <div className="flex space-x-2">
        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTokenLogin()}
          className="flex-1"
        />
        <Button 
          onClick={handleTokenLogin} 
          disabled={!token.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
        <p className="font-medium mb-1">How to create a Personal Access Token:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
          <li>Click "Generate new token (classic)"</li>
          <li>Select scopes: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">repo</code>, <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">user</code></li>
          <li>Copy and paste the token here</li>
        </ol>
      </div>
    </div>
  );
}