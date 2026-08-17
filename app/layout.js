// app/layout.js - Root Layout with AuthProvider
import { AuthProvider } from './contexts/AuthContext';
import ChunkErrorReloader from './components/ChunkErrorReloader';
import { Sarabun } from 'next/font/google';
import './globals.css';

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'thai'],
  display: 'swap',
  variable: '--font-sarabun',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
});

export const metadata = {
  title: 'กองทุนวิจัยฯ วิทยาลัยการคอมพิวเตอร์ - วิทยาลัยการคอมพิวเตอร์ มข.',
  description: 'ระบบบริหารจัดการทุนวิจัยสำหรับอาจารย์และเจ้าหน้าที่ วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น',
  keywords: 'fund management, research fund, university, computer science, KKU',
  authors: [{ name: 'วิทยาลัยการคอมพิวเตอร์ มข.' }],
  robots: 'noindex, nofollow', // Prevent indexing for internal system
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/*
          กู้ ChunkLoadError ให้เร็วที่สุด: inline script ใน <head> ทำงานก่อน chunk ใด ๆ จะโหลด
          จึงจับ error ได้แม้ chunk ที่แชร์/dynamic พังตั้งแต่ render แรก (ก่อน useEffect ของ
          ChunkErrorReloader จะติดตั้ง handler ทัน) -> reload พร้อม ?cb เพื่อ cache-bust ดึง HTML สด
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{function r(){try{var k='__chunkReloadAt',l=+sessionStorage.getItem(k)||0;if(Date.now()-l<10000)return;sessionStorage.setItem(k,String(Date.now()));var u=new URL(location.href);u.searchParams.set('cb',String(Date.now()));location.replace(u.toString())}catch(e){location.reload()}}function h(e){var m=(e&&(e.message||(e.reason&&e.reason.message)))||'';if(/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported/i.test(m)){r()}}window.addEventListener('error',h);window.addEventListener('unhandledrejection',h)}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-sans">
        <ChunkErrorReloader />
        <AuthProvider>
          <div id="root">
            {children}
          </div>
          
          {/* Portal for modals */}
          <div id="modal-root"></div>
          
          {/* Portal for notifications */}
          <div id="notification-root"></div>
        </AuthProvider>
      </body>
    </html>
  );
}
