'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Loader2, 
  Code,
  FileText,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  selected?: boolean;
  content?: string;
  size?: number;
}

interface FileTreeProps {
  repo: any;
  accessToken: string;
  onFilesLoad: (files: FileNode[]) => void;
  onFileSelection: (files: FileNode[]) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go'];
  
  if (codeExtensions.includes(ext || '')) {
    return <Code className="w-4 h-4 text-blue-500" />;
  }
  
  return <FileText className="w-4 h-4 text-gray-500" />;
};

const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: { [key: string]: string } = {
    'js': 'JavaScript',
    'jsx': 'React',
    'ts': 'TypeScript',
    'tsx': 'React TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'vue': 'Vue',
    'svelte': 'Svelte'
  };
  return langMap[ext || ''] || '';
};

export function FileTree({ repo, accessToken, onFilesLoad, onFileSelection }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFileTree();
  }, [repo]);

  useEffect(() => {
    const selected = fileTree
      .filter(file => selectedFiles.has(file.path) && file.type === 'file')
      .filter(file => {
        const lang = getLanguageFromExtension(file.name);
        return lang !== ''; // Only include files with recognized languages
      });
    
    onFileSelection(selected);
  }, [selectedFiles, fileTree]);

  const fetchFileTree = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/github/files?repo=${repo.full_name}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const files = await response.json();
        setFileTree(files);
        onFilesLoad(files);
      } else {
        throw new Error('Failed to fetch file tree');
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
      toast.error('Failed to fetch file tree');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDirectory = async (path: string) => {
    const newExpanded = new Set(expandedDirs);
    
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      
      // Load directory contents if not loaded
      const dir = findNodeByPath(fileTree, path);
      if (dir && (!dir.children || dir.children.length === 0)) {
        setLoadingPaths(prev => new Set([...prev, path]));
        
        try {
          const response = await fetch(`/api/github/files?repo=${repo.full_name}&path=${path}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          
          if (response.ok) {
            const children = await response.json();
            updateNodeChildren(fileTree, path, children);
            setFileTree([...fileTree]);
          }
        } catch (error) {
          console.error('Error loading directory:', error);
          toast.error('Failed to load directory contents');
        } finally {
          setLoadingPaths(prev => {
            const newSet = new Set(prev);
            newSet.delete(path);
            return newSet;
          });
        }
      }
    }
    
    setExpandedDirs(newExpanded);
  };

  const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeChildren = (nodes: FileNode[], path: string, children: FileNode[]) => {
    for (const node of nodes) {
      if (node.path === path) {
        node.children = children;
        return;
      }
      if (node.children) {
        updateNodeChildren(node.children, path, children);
      }
    }
  };

  const toggleFileSelection = (path: string) => {
    const newSelected = new Set(selectedFiles);
    
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    
    setSelectedFiles(newSelected);
  };

  const selectAllCodeFiles = () => {
    const codeFiles = getAllCodeFiles(fileTree);
    setSelectedFiles(new Set(codeFiles.map(f => f.path)));
    toast.success(`Selected ${codeFiles.length} code files`);
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
    toast.success('Selection cleared');
  };

  const getAllCodeFiles = (nodes: FileNode[]): FileNode[] => {
    let codeFiles: FileNode[] = [];
    
    for (const node of nodes) {
      if (node.type === 'file' && getLanguageFromExtension(node.name)) {
        codeFiles.push(node);
      }
      if (node.children) {
        codeFiles = [...codeFiles, ...getAllCodeFiles(node.children)];
      }
    }
    
    return codeFiles;
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFiles.has(node.path);
    const isLoading = loadingPaths.has(node.path);
    const language = getLanguageFromExtension(node.name);
    const isCodeFile = node.type === 'file' && language;

    return (
      <div key={node.path}>
        <div 
          className={`flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {node.type === 'dir' ? (
            <>
              <div onClick={() => toggleDirectory(node.path)} className="flex items-center space-x-2 flex-1">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Folder className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {node.name}
                </span>
              </div>
            </>
          ) : (
            <>
              {isCodeFile && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleFileSelection(node.path)}
                />
              )}
              <div className="flex items-center space-x-2 flex-1">
                {getFileIcon(node.name)}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {node.name}
                </span>
                {language && (
                  <Badge variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
        
        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedCount = selectedFiles.size;
  const totalCodeFiles = getAllCodeFiles(fileTree).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {selectedCount} of {totalCodeFiles} files selected
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={selectAllCodeFiles}
            disabled={totalCodeFiles === 0}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Select All Code Files
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearSelection}
            disabled={selectedCount === 0}
          >
            <Square className="w-4 h-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading file tree...
          </span>
        </div>
      ) : (
        <Card>
          <ScrollArea className="h-96">
            <div className="p-2">
              {fileTree.map(node => renderNode(node))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}