import { QuestionSummarizeWidget } from "metabase/query_builder/components/view/ViewHeader/components";
import cx from "classnames";
import CS from "metabase/css/core/index.css";
import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";

export const SummarizeButton = () => {
  const { onSummarizeThingOpen, onSummarizeThingClose, question, uiControls } =
    useInteractiveQuestionContext();

  return (
    question && QuestionSummarizeWidget.shouldRender({
      question,
      queryBuilderMode: uiControls.queryBuilderMode,
      isObjectDetail: false,
      isActionListVisible: true,
    }) && (
      <QuestionSummarizeWidget
        className={cx(CS.hide, CS.smShow)}
        isShowingSummarySidebar={uiControls.isShowingSummarySidebar}
        onEditSummary={onSummarizeThingOpen}
        onCloseSummary={onSummarizeThingClose}
      />
    )
  );
};
