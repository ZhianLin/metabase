import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import { ViewHeaderIconButtonContainer } from "metabase/query_builder/components/view/ViewHeader/ViewHeader.styled";
import { QuestionNotebookButton } from "metabase/query_builder/components/view/ViewHeader/components";

export const NotebookButton = () => {
  const { onNotebookOpen, question, uiControls } =
    useInteractiveQuestionContext();

  return question && QuestionNotebookButton.shouldRender({
    question,
    isActionListVisible: true,
  }) ? (
    <ViewHeaderIconButtonContainer>
      <QuestionNotebookButton
        iconSize={16}
        question={question}
        isShowingNotebook={uiControls.queryBuilderMode === "notebook"}
        setQueryBuilderMode={onNotebookOpen}
      />
    </ViewHeaderIconButtonContainer>
  ) : null;
};
