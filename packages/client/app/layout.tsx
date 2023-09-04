import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { MainLayout } from './_components/main-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Virtual Lab',
    description: 'Virtual Lab',
};

const styles = `
:root {
    --font-inter: ${inter.style.fontFamily};
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='pt-br'>
            <body className={inter.className}>
                <Providers styles={styles}>
                    <MainLayout>{children}</MainLayout>
                </Providers>
            </body>
        </html>
    );
}
