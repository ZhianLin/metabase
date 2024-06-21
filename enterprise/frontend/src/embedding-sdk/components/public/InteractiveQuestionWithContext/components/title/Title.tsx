import cx from "classnames";

import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import CS from "metabase/css/core/index.css";

export const Title = () => {
  const { question } = useInteractiveQuestionContext();
  return <h2 className={cx(CS.h2, CS.textWrap)}>{question.displayName()}</h2>;
};
