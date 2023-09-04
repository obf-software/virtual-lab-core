import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Virtual Lab',
    description: 'Virtual Lab',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='pt-br'>
            <style
                jsx
                global
            >
                {`
                    :root {
                        --font-inter: ${inter.style.fontFamily};
                    }
                `}
            </style>
            <body className={inter.className}>
                <Providers>
                    {/* <Navbar cmsData={layout.data.attributes.navbar} /> */}
                    {children}
                    {/* <Footer cmsData={layout.data.attributes.footer} /> */}
                </Providers>
            </body>
        </html>
    );
}
