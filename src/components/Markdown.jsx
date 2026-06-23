// src/components/Markdown.jsx
// Minimal, dependency-free markdown renderer for the Guide / Privacy / Terms /
// About pages. Supports headings, lists, blockquotes, hr, bold/italic, links,
// and paragraphs. Content is app-authored (trusted), so no sanitiser needed.
import { Fragment } from "react";

function inline(text, keyBase) {
  // links [t](u), **bold**, *italic*
  const nodes = [];
  let rest = text;
  let i = 0;
  const re = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/;
  let m;
  while ((m = re.exec(rest))) {
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    if (m[1]) {
      const href = m[3];
      const external = /^https?:\/\//.test(href);
      nodes.push(
        <a
          key={`${keyBase}-a-${i}`}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-focus underline underline-offset-2"
        >
          {m[2]}
        </a>
      );
    } else if (m[4]) {
      nodes.push(
        <strong key={`${keyBase}-b-${i}`} className="text-pearl font-semibold">
          {m[5]}
        </strong>
      );
    } else if (m[6]) {
      nodes.push(
        <em key={`${keyBase}-i-${i}`}>{m[7]}</em>
      );
    }
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  if (rest) nodes.push(rest);
  return nodes;
}

export default function Markdown({ source = "", className = "" }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = null;
  let para = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", items: list });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      flushPara();
      flushList();
      const level = line.match(/^#+/)[0].length;
      blocks.push({ type: "h", level, text: line.replace(/^#+\s/, "") });
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      (list = list || []).push(line.replace(/^[-*]\s/, ""));
    } else if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, "") });
    } else if (/^---+$/.test(line)) {
      flushPara();
      flushList();
      blocks.push({ type: "hr" });
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();

  return (
    <div className={`space-y-3 leading-relaxed text-pearl-soft ${className}`}>
      {blocks.map((b, idx) => {
        const k = `b-${idx}`;
        if (b.type === "h") {
          const sizes = { 1: "text-2xl", 2: "text-xl", 3: "text-lg", 4: "text-base", 5: "text-base", 6: "text-base" };
          const Tag = `h${Math.min(6, b.level)}`;
          return (
            <Tag
              key={k}
              className={`font-display text-pearl ${sizes[b.level] || "text-base"} ${b.level === 1 ? "mt-1" : "mt-5"} mb-1`}
            >
              {inline(b.text, k)}
            </Tag>
          );
        }
        if (b.type === "p") return <p key={k}>{inline(b.text, k)}</p>;
        if (b.type === "ul")
          return (
            <ul key={k} className="list-disc pl-5 space-y-1">
              {b.items.map((it, j) => (
                <li key={`${k}-${j}`}>{inline(it, `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        if (b.type === "quote")
          return (
            <blockquote key={k} className="border-l-2 border-gold/60 pl-4 italic text-pearl">
              {inline(b.text, k)}
            </blockquote>
          );
        if (b.type === "hr") return <hr key={k} className="border-white/10 my-4" />;
        return <Fragment key={k} />;
      })}
    </div>
  );
}
