import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { ProvidePlugin } from 'webpack';

const config: Config = {
    title: 'Virtual Lab',
    favicon: 'img/favicon.ico',
    noIndex: true,
    url: 'https://your-docusaurus-site.example.com',
    baseUrl: '/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },
    customFields: {
        apiDocumentationSpecUrl: process.env.API_DOCUMENTATION_SPEC_URL,
    },
    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],
    themeConfig: {
        navbar: {
            title: 'Virtual Lab',
            logo: {
                alt: 'Virtual Lab Emblem',
                src: 'img/emblem-light.png',
                srcDark: 'img/emblem-dark.png',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docsSidebar',
                    position: 'left',
                    label: 'Docs',
                },
                {
                    label: 'API',
                    position: 'left',
                    href: '/api',
                },
                {
                    href: 'https://github.com/obf-software/virtual-lab-core',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            logo: {
                src: 'img/logo-light.png',
                srcDark: 'img/logo-dark.png',
            },
            copyright: `Copyright © ${new Date().getFullYear()} OBF Software`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
    plugins: [
        'docusaurus-plugin-sass',
        () => ({
            name: 'custom-webpack-config',
            configureWebpack: () => ({
                module: {
                    rules: [
                        {
                            test: /\.m?js/,
                            resolve: {
                                fullySpecified: false,
                            },
                        },
                    ],
                },
                plugins: [
                    new ProvidePlugin({
                        process: require.resolve('process/browser'),
                    }),
                ],
                resolve: {
                    fallback: {
                        buffer: require.resolve('buffer'),
                        stream: false,
                        path: false,
                        process: false,
                    },
                },
            }),
        }),
    ],
};

export default config;
