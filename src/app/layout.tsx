import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A2000 | AI Enablement",
  description: "A2000 AI Enablement Confidential Enterprise Discovery Assessment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                    },
                    colors: {
                      navy: {
                        800: '#17324D',
                        900: '#0E2135',
                      },
                      ochre: {
                        500: '#C97835',
                        600: '#B56627',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-slate-100/70 text-slate-900 font-sans antialiased min-h-screen py-8 px-3 sm:px-6">
        {children}
      </body>
    </html>
  );
}
