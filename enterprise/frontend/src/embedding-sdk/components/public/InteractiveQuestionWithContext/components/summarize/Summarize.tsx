import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import { SummarizeContent } from "metabase/query_builder/components/view/sidebars/SummarizeSidebar";

export const Summarize = () => {
  const {
    isSummarizeThingOpen,
    onQueryChange,
    question,
  } = useInteractiveQuestionContext();

  return (
    question &&
    isSummarizeThingOpen && (
      <SummarizeContent
        query={question.query()}
        onQueryChange={onQueryChange}
      />
    )
  );
};
