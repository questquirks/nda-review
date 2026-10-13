import { IBM_Plex_Sans_Thai, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const sans = IBM_Plex_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500', '600'], variable: '--font-sans' });
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-serif' });

export const metadata = { title: 'NDA Review', description: 'รีวิว Mutual NDA ตาม playbook' };

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
