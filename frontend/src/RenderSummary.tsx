import React from "react";

// Props interface to receive summary history
interface SummaryHistoryProps {
  summaryHistory: string;
}

// Helper function to parse content (bold headings and regular text)
const parseContent = (content: string) => {
  const parts = content.split("**").map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} className="font-bold">
          <br />
          <br />
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
  return parts;
};

const RenderSummary: React.FC<SummaryHistoryProps> = ({ summaryHistory }) => {
  return <> {parseContent(summaryHistory)} </>;
};

export default RenderSummary;
