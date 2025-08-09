'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, Search, Loader2, Lock, Globe } from 'lucide-react';
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

interface RepoSelectorProps {
  accessToken: string;
  onRepoSelect: (repo: Repository) => void;
  selectedRepo: Repository | null;
}

export function RepoSelector({ accessToken, onRepoSelect, selectedRepo }: RepoSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, [accessToken]);

  useEffect(() => {
    const filtered = repositories.filter(repo =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepos(filtered);
  }, [repositories, searchTerm]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/github/repositories', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
        setFilteredRepos(repos);
      } else {
        throw new Error('Failed to fetch repositories');
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedRepo) {
    return (
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedRepo.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedRepo.language || 'Repository'}
                </Badge>
                {selectedRepo.private ? (
                  <Lock className="w-3 h-3 text-gray-500" />
                ) : (
                  <Globe className="w-3 h-3 text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRepo.description || 'No description'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRepoSelect(null as any)}
          >
            Change
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchRepositories}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading repositories...
          </span>
        </div>
      ) : (
        <ScrollArea className="h-64 border rounded-lg">
          <div className="p-2 space-y-2">
            {filteredRepos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No repositories found
              </div>
            ) : (
              filteredRepos.map((repo) => (
                <Card
                  key={repo.id}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => onRepoSelect(repo)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {repo.name}
                        </span>
                        {repo.private ? (
                          <Lock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        ) : (
                          <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        )}
                        {repo.language && (
                          <Badge variant="secondary" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {repo.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Updated {formatDate(repo.updated_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}