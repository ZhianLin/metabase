import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import { default as QBNotebook } from "metabase/query_builder/components/notebook/Notebook";

export const Notebook = () => {
  const {
    isNotebookOpen,
    onNotebookClose,
    onQueryChange,
    reportTimezone,
    question,
  } = useInteractiveQuestionContext();

  return question && isNotebookOpen ? (
    <QBNotebook
      question={question}
      hasVisualizeButton={true}
      isDirty={false}
      isResultDirty={false}
      isRunnable={true}
      readOnly={false}
      reportTimezone={reportTimezone}
      updateQuestion={async q => {
        await onQueryChange(q.query());
      }}
      runQuestionQuery={(...args: any[]) => {
        console.log("runQuestionQuery", args);
      }}
      setQueryBuilderMode={() => {
        onNotebookClose();
      }}
    />
  ) : null;
};
