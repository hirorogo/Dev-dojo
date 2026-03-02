import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Dev-Dojo',
  tagline: '学んだことを記録し、共有する場所',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://hirorogo.github.io',
  baseUrl: '/Dev-dojo/',
  organizationName: 'hirorogo',
  projectName: 'Dev-dojo',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
          editUrl:
            'https://github.com/hirorogo/Dev-Dojo/tree/main/devdojo/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/hirorogo/Dev-Dojo/tree/main/devdojo/',
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
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
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
          label: 'ドキュメント',
        },
        {
          to: '/docs/category/スマホ改造ガイド',
          label: 'スマホ改造',
          position: 'left',
        },
        {to: '/blog', label: 'ブログ', position: 'left'},
        {
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
          title: 'ドキュメント',
          items: [
            {
              label: 'はじめに',
              to: '/docs/intro',
            },
            {
              label: 'オブジェクト指向',
              to: '/docs/object',
            },
            {
              label: 'Gitの使い方',
              to: '/docs/How to use git',
            },
          ],
        },
        {
          title: 'スマホ改造',
          items: [
            {
              label: 'ガイド一覧',
              to: '/docs/category/スマホ改造ガイド',
            },
            {
              label: 'BLアンロック手順',
              to: '/docs/phone-mod/bootloader-unlock',
            },
            {
              label: 'root化手順',
              to: '/docs/phone-mod/ta-partition',
            },
          ],
        },
        {
          title: 'リンク',
          items: [
            {
              label: 'ブログ',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/hirorogo/Dev-Dojo',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Dev-Dojo. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'python', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
