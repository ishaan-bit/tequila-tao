// src/components/InfoPage.jsx — shared layout for Guide/Privacy/Terms/About.
import Page, { BackHeader } from "./Page.jsx";
import Markdown from "./Markdown.jsx";

export default function InfoPage({ title, source }) {
  return (
    <Page>
      <div className="max-w-xl mx-auto">
        <BackHeader title={title} />
        <div className="px-safe pb-gutter">
          <div className="glass rounded-3xl p-5 sm:p-6">
            <Markdown source={source} />
          </div>
        </div>
      </div>
    </Page>
  );
}
