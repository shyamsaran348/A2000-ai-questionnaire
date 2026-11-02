import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A2000 Hospital AI Opportunity Discovery Questionnaire",
  description: "A2000 AI Opportunity Assessment Questionnaire for Healthcare Providers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
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
