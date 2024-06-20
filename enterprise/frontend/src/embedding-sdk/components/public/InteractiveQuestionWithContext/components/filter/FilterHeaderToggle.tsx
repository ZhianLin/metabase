import cx from "classnames";

import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import CS from "metabase/css/core/index.css";
import { FilterHeaderToggle as QBFilterHeaderToggle } from "metabase/query_builder/components/view/ViewHeader/components";

export const FilterHeaderToggle = () => {
  const {
    onCollapseFilters,
    onExpandFilters,
    question,
    uiControls,
    areFiltersExpanded,
  } = useInteractiveQuestionContext();

  return (
    question &&
    QBFilterHeaderToggle.shouldRender({
      question,
      queryBuilderMode: uiControls.queryBuilderMode,
      isObjectDetail: false,
    }) && (
      <QBFilterHeaderToggle
        className={cx(CS.ml2, CS.mr1)}
        query={question.query()}
        isExpanded={areFiltersExpanded}
        onExpand={onExpandFilters}
        onCollapse={onCollapseFilters}
      />
    )
  );
};
