import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

/**
 * Open-source software Legalite is built with, and the licence each is
 * distributed under. Generated from the app's runtime dependencies.
 */

const LIBRARIES: { name: string; license: string }[] = [
  {
    name: "@apollo/client",
    license: "MIT",
  },
  {
    name: "@base-ui/react",
    license: "MIT",
  },
  {
    name: "@hookform/resolvers",
    license: "MIT",
  },
  {
    name: "@phosphor-icons/react",
    license: "MIT",
  },
  {
    name: "@supabase/ssr",
    license: "MIT",
  },
  {
    name: "@supabase/supabase-js",
    license: "MIT",
  },
  {
    name: "@tailwindcss/typography",
    license: "MIT",
  },
  {
    name: "@tanstack/react-query",
    license: "MIT",
  },
  {
    name: "@tanstack/react-table",
    license: "MIT",
  },
  {
    name: "Tiptap editor (@tiptap/*)",
    license: "MIT",
  },
  {
    name: "axios",
    license: "MIT",
  },
  {
    name: "class-variance-authority",
    license: "Apache-2.0",
  },
  {
    name: "clsx",
    license: "MIT",
  },
  {
    name: "graphql",
    license: "MIT",
  },
  {
    name: "next",
    license: "MIT",
  },
  {
    name: "next-themes",
    license: "MIT",
  },
  {
    name: "nprogress",
    license: "MIT",
  },
  {
    name: "react",
    license: "MIT",
  },
  {
    name: "react-dom",
    license: "MIT",
  },
  {
    name: "react-hook-form",
    license: "MIT",
  },
  {
    name: "react-markdown",
    license: "MIT",
  },
  {
    name: "resend",
    license: "MIT",
  },
  {
    name: "sonner",
    license: "MIT",
  },
  {
    name: "tailwind-merge",
    license: "MIT",
  },
  {
    name: "tw-animate-css",
    license: "MIT",
  },
  {
    name: "zod",
    license: "MIT",
  },
  {
    name: "zustand",
    license: "MIT",
  },
];

const LICENSE_URL: Record<string, string> = {
  MIT: "https://opensource.org/license/mit",
  "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
};

export default function LicenseAttributionPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/settings"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1
          className="font-heading text-2xl font-bold"
          style={{ color: "var(--navy)" }}
        >
          Licence attribution
        </h1>
        <p
          className="mt-1 text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Legalite is built with the open-source software below. We are grateful
          to their authors. Each is used under the licence shown, and a copy of
          every licence ships with the software.
        </p>

        <div
          className="mt-6 overflow-hidden rounded-2xl border bg-white"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr
                className="text-left"
                style={{
                  background: "var(--surface-sunken)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-4 py-2.5 font-semibold">Software</th>
                <th className="px-4 py-2.5 font-semibold">Licence</th>
              </tr>
            </thead>
            <tbody>
              {LIBRARIES.map((lib) => (
                <tr
                  key={lib.name}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td
                    className="px-4 py-2.5 font-medium"
                    style={{ color: "var(--navy)" }}
                  >
                    {lib.name}
                  </td>
                  <td className="px-4 py-2.5">
                    {LICENSE_URL[lib.license] ? (
                      <a
                        href={LICENSE_URL[lib.license]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: "var(--gold-dark)" }}
                      >
                        {lib.license}
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-secondary)" }}>
                        {lib.license}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
