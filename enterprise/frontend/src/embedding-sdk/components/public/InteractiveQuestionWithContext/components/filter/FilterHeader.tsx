import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import { useDispatch } from "metabase/lib/redux";
import { updateQuestion } from "metabase/query_builder/actions";
import { FilterHeader as QBFilterHeader } from "metabase/query_builder/components/view/ViewHeader/components";

export const FilterHeader = () => {
  const { question, uiControls } = useInteractiveQuestionContext();
  const dispatch = useDispatch();

  return (
    question &&
    QBFilterHeader.shouldRender({
      question,
      queryBuilderMode: uiControls.queryBuilderMode,
      isObjectDetail: false,
    }) && (
      <QBFilterHeader
        expanded
        question={question}
        updateQuestion={(...args) => dispatch(updateQuestion(...args))}
      />
    )
  );
};
