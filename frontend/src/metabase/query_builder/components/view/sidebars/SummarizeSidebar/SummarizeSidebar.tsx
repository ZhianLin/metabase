import { useCallback } from "react";
import { t } from "ttag";

import { color } from "metabase/lib/colors";

import {
  SummarizeContent,
  type SummarizeContentProps,
} from "./SummarizeContent";
import { SidebarView } from "./SummarizeSidebar.styled";

type SummarizeSidebarProps = {
  className?: string;
  onClose: () => void;
} & SummarizeContentProps;

export function SummarizeSidebar({
  className,
  query,
  onQueryChange,
  onClose,
}: SummarizeSidebarProps) {
  const handleDoneClick = useCallback(() => {
    onQueryChange(query);
    onClose();
  }, [query, onQueryChange, onClose]);

  return (
    <SidebarView
      className={className}
      title={t`Summarize by`}
      color={color("summarize")}
      onDone={handleDoneClick}
    >
      <SummarizeContent query={query} onQueryChange={onQueryChange} />
    </SidebarView>
  );
}
