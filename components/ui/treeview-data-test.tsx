import { v4 as uuid } from 'uuid'

import { TreeNodeType } from './treeview'

export const data: TreeNodeType[] = [
  {
    id: uuid(),
    content: 'components',
    children: [
      {
        id: uuid(),
        content: 'toggle-group',
        children: [
          {
            id: uuid(),
            content: 'index.ts',
          },
          {
            id: uuid(),
            content: 'toggle-group.tsx',
          },
        ],
      },
      {
        id: uuid(),
        content: 'treeview',
        children: [
          {
            id: uuid(),
            content: 'icons.tsx',
          },
          {
            id: uuid(),
            content: 'index.tsx',
          },
          {
            id: uuid(),
            content: 'treeview.tsx',
          },
        ],
      },
      {
        id: uuid(),
        content: 'long-component-folder-name-that-overflows',
        children: [
          {
            id: uuid(),
            content: 'index.tsx',
          },
          {
            id: uuid(),
            content: 'long-component.tsx',
          },
        ],
      },
      {
        id: uuid(),
        content: 'index.tsx',
      },
      {
        id: uuid(),
        content: 'long-util-file-name-that-overflows.tsx',
      },
      {
        id: uuid(),
        content: 'roving-tabindex.tsx',
      },
    ],
  },
  {
    id: uuid(),
    content: 'lib',
    children: [
      {
        id: uuid(),
        content: 'treeview',
        children: [
          {
            id: uuid(),
            content: 'index.ts',
          },
          {
            id: uuid(),
            content: 'initialValue.ts',
          },
          {
            id: uuid(),
            content: 'tree-state.tsx',
          },
          {
            id: uuid(),
            content: 'useTreeNode.tsx',
          },
        ],
      },
      {
        id: uuid(),
        content: 'utils',
        children: [
          {
            id: uuid(),
            content: 'chainable-map.ts',
          },
          {
            id: uuid(),
            content: 'index.ts',
          },
        ],
      },
    ],
  },
  {
    id: uuid(),
    content: 'pages',
    children: [
      {
        id: uuid(),
        content: '_app.tsx',
      },
      {
        id: uuid(),
        content: '_document.tsx',
      },
      {
        id: uuid(),
        content: 'index.tsx',
      },
      {
        id: uuid(),
        content: 'toggle-group.tsx',
      },
      {
        id: uuid(),
        content: 'treeview.tsx',
      },
    ],
  },
  {
    id: uuid(),
    content: 'public',
    children: [
      {
        id: uuid(),
        content: 'favicon.ico',
      },
      {
        id: uuid(),
        content: 'file.png',
      },
      {
        id: uuid(),
        content: 'folder.png',
      },
      {
        id: uuid(),
        content: 'next.svg',
      },
      {
        id: uuid(),
        content: 'thirteen.svg',
      },
      {
        id: uuid(),
        content: 'vercel.svg',
      },
    ],
  },
  {
    id: uuid(),
    content: 'styles',
    children: [
      {
        id: uuid(),
        content: 'global.css',
      },
    ],
  },
  {
    id: uuid(),
    content: '.eslintrc.json',
  },
  {
    id: uuid(),
    content: '.gitignore',
  },
  {
    id: uuid(),
    content: '.prettierrc.js',
  },
  {
    id: uuid(),
    content: 'next-env.d.ts',
  },
  {
    id: uuid(),
    content: 'next.config.js',
  },
  {
    id: uuid(),
    content: 'package.json',
  },
  {
    id: uuid(),
    content: 'postcss.config.js',
  },
  {
    id: uuid(),
    content: 'README.md',
  },
  {
    id: uuid(),
    content: 'tailwind.config.js',
  },
  {
    id: uuid(),
    content: 'tsconfig.json',
  },
  {
    id: uuid(),
    content: 'yarn.lock',
  },
]
