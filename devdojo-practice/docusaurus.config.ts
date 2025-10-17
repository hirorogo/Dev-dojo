import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Dev-Dojo',
  tagline: '開発の練習と学習を記録するサイト',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, 
  },

  url: 'https://hirorogo.github.io', 
  baseUrl: '/Dev-Dojo/', // 大文字Dで始まる
  // GitHubPages用: GitHubユーザー名またはOrganization名
  organizationName: 'hirorogo', // 例: 'ootomonaiso'
  // GitHubPages用: リポジトリ名
  projectName: 'Dev-Dojo', // 大文字Dで始まる

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // GitHubPages対応: トレイリングスラッシュの設定（推奨）
  // trailingSlash: false,
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // GitHubPages用: 実際のリポジトリのeditURL
          editUrl:
            'https://github.com/hirorogo/Dev-Dojo/tree/main/devdojo-practice/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // GitHubPages用: 実際のリポジトリのeditURL
          editUrl:
            'https://github.com/hirorogo/Dev-Dojo/tree/main/devdojo-practice/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      // サイトタイトル
      title: 'Dev-Dojo',
      logo: {
        alt: 'Dev-Dojo Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          // GitHubリンク
          href: 'https://github.com/hirorogo/Dev-Dojo',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'X',
              href: 'https://x.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              // フッターのGitHubリンク（実際のリポジトリURLに変更）
              href: 'https://github.com/hirorogo/Dev-Dojo',
            },
          ],
        },
      ],
      // コピーライト表示
      copyright: `Copyright © ${new Date().getFullYear()} Dev-Dojo, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
