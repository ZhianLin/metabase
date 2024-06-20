import { ResetButton as SdkResetButton } from "embedding-sdk/components/private/ResetButton";
import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";

export const ResetButton = () => {
  const { hasQuestionChanges, handleQuestionReset, withResetButton } =
    useInteractiveQuestionContext();

  return (
    hasQuestionChanges &&
    withResetButton && <SdkResetButton onClick={handleQuestionReset} />
  );
};
