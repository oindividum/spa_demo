export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  depth: number;
}

export function buildFlatTree(filePaths: string[]): FileNode[] {
  const rootNodes: any[] = [];
  
  const cleanPaths = filePaths.filter(p => !p.includes('.DS_Store'));
  
  for (const filePath of cleanPaths) {
    let normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const parts = normalizedPath.split('/').filter(Boolean);
    let currentLevel = rootNodes;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = i === parts.length - 1;
        
        let existingNode = currentLevel.find((n: any) => n.name === part);
        if (!existingNode) {
            existingNode = {
                name: part,
                path: currentPath,
                isDirectory: !isLast,
                children: []
            };
            currentLevel.push(existingNode);
        } else if (isLast) {
            existingNode.isDirectory = false;
        }
        currentLevel = existingNode.children;
    }
  }

  function sortNodes(nodes: any[]) {
    nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            sortNodes(node.children);
        }
    }
  }
  sortNodes(rootNodes);

  const result: FileNode[] = [];
  function traverse(nodes: any[], depth: number) {
     for (const node of nodes) {
         result.push({
             name: node.name,
             path: node.path,
             isDirectory: node.isDirectory,
             depth
         });
         traverse(node.children, depth + 1);
     }
  }
  traverse(rootNodes, 0);
  return result;
}
