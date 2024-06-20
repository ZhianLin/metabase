import cx from "classnames";
import { t } from "ttag";

import { SdkError } from "embedding-sdk/components/private/PublicComponentWrapper";
import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import type { SdkClickActionPluginsConfig } from "embedding-sdk/lib/plugins";
import CS from "metabase/css/core/index.css";
import { useDispatch } from "metabase/lib/redux";
import { navigateToNewCardInsideQB } from "metabase/query_builder/actions";
import QueryVisualization from "metabase/query_builder/components/QueryVisualization";
import { Group, Stack, Box, Loader } from "metabase/ui";

interface InteractiveQuestionProps {
  withTitle?: boolean;
  customTitle?: React.ReactNode;
  plugins?: SdkClickActionPluginsConfig;
  height?: string | number;
}

export const _InteractiveQuestion = ({
  height,
}: InteractiveQuestionProps): JSX.Element | null => {
  const dispatch = useDispatch();

  const {
    card,
    defaultHeight,
    result,
    question,
    queryResults,
    mode,
    handleQuestionReset,
    isQueryRunning,
    isQuestionLoading,
  } = useInteractiveQuestionContext();

  if (isQuestionLoading || isQueryRunning) {
    return <Loader data-testid="loading-spinner" />;
  }

  if (!queryResults || !question) {
    return <SdkError message={t`Question not found`} />;
  }

  return (
    <Box
      className={cx(CS.flexFull, CS.fullWidth)}
      h={height ?? defaultHeight}
      bg="var(--mb-color-bg-question)"
    >
      <Stack h="100%">
        <Group h="100%" pos="relative" align="flex-start">
          <QueryVisualization
            className={cx(CS.flexFull, CS.fullWidth, CS.fullHeight)}
            question={question}
            rawSeries={[{ card, data: result && result.data }]}
            isRunning={isQueryRunning}
            isObjectDetail={false}
            isResultDirty={false}
            isNativeEditorOpen={false}
            result={result}
            noHeader
            mode={mode}
            navigateToNewCardInsideQB={(props: any) => {
              dispatch(navigateToNewCardInsideQB(props));
            }}
            onNavigateBack={handleQuestionReset}
          />
        </Group>
      </Stack>
    </Box>
  );
};

export const ContextualInteractiveQuestion = _InteractiveQuestion;
