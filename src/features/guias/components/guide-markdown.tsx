/**
 * @file guide-markdown.tsx
 * @description Renders guide markdown body with TruePhone prose tokens.
 * @dependencies react-markdown, remark-gfm, next/link
 */

import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type GuideMarkdownProps = {
  content: string;
};

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-foreground mt-10 scroll-mt-36 text-lg font-semibold tracking-tight first:mt-0 md:scroll-mt-40">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-foreground mt-6 text-base font-semibold tracking-tight">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-muted-foreground italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-muted-foreground list-decimal space-y-2 pl-5 text-sm leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  hr: () => <hr className="border-border my-8" />,
  a: ({ href, children }) => {
    const className =
      "text-trust font-medium underline-offset-4 hover:underline";

    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-border text-muted-foreground border-l-2 pl-4 text-sm italic">
      {children}
    </blockquote>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- markdown hero from /public
    <img
      src={src}
      alt={alt ?? ""}
      className="border-border my-6 w-full rounded-xl border"
    />
  ),
  input: ({ type, checked, disabled }) => {
    if (type !== "checkbox") {
      return null;
    }

    return (
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        readOnly
        className="border-border text-trust mr-2 size-4 align-middle"
      />
    );
  },
};

/**
 * GuideMarkdown
 *
 * Server component that renders sanitized guide body markdown.
 *
 * @param props.content - Markdown without the page H1 or NOTES section.
 * @returns Styled article content.
 * @calledBy /guias/[slug] page
 */
export function GuideMarkdown({ content }: GuideMarkdownProps) {
  return (
    <article className="tp-prose mx-auto w-full max-w-2xl space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
