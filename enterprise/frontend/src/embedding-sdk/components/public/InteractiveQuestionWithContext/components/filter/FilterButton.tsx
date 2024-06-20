import { FilterHeaderButton } from "metabase/query_builder/components/view/ViewHeader/components";
import cx from "classnames";
import CS from "metabase/css/core/index.css";
import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";

export const FilterButton = () => {
  const { onFilterModalOpen, question, uiControls } =
    useInteractiveQuestionContext();

  return question &&
    FilterHeaderButton.shouldRender({
      question,
      queryBuilderMode: uiControls.queryBuilderMode,
      isObjectDetail: false,
      isActionListVisible: true,
    }) ? (
    <FilterHeaderButton
      className={cx(CS.hide, CS.smShow)}
      onOpenModal={onFilterModalOpen}
    />
  ) : null;
};
