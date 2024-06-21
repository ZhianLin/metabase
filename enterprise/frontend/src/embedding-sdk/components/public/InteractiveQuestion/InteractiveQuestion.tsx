import cx from "classnames";

import {
  ContextualInteractiveQuestion,
  FilterHeader,
  InteractiveQuestionProvider,
  ResetButton,
} from "embedding-sdk";
import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import type { SdkClickActionPluginsConfig } from "embedding-sdk/lib/plugins";
import CS from "metabase/css/core/index.css";
import { useDispatch } from "metabase/lib/redux";
import { Flex, Stack, Box } from "metabase/ui";
import type { CardId } from "metabase-types/api";

import { Title } from "../InteractiveQuestionWithContext/components/title";

interface InteractiveQuestionProps {
  questionId: CardId;
  withResetButton?: boolean;
  withTitle?: boolean;
  customTitle?: React.ReactNode;
  plugins?: SdkClickActionPluginsConfig;
  height?: string | number;
}

export const InteractiveQuestionWrapper = ({
  questionId,
  withTitle = false,
  customTitle,
  plugins: componentPlugins,
  withResetButton = true,
  height,
}: InteractiveQuestionProps) => {
  return (
    <InteractiveQuestionProvider
      questionId={questionId}
      plugins={componentPlugins}
    >
      <_InteractiveQuestion
        withResetButton={withResetButton}
        withTitle={withTitle}
        customTitle={customTitle}
        plugins={componentPlugins}
        height={height}
      />
    </InteractiveQuestionProvider>
  );
};

export const _InteractiveQuestion = ({
  customTitle,
  withResetButton = true,
  height,
  withTitle,
}: Omit<InteractiveQuestionProps, "questionId">): JSX.Element | null => {
  useDispatch();

  const { defaultHeight, hasQuestionChanges } = useInteractiveQuestionContext();

  return (
    <Box
      className={cx(CS.flexFull, CS.fullWidth)}
      h={height ?? defaultHeight}
      bg="var(--mb-color-bg-question)"
    >
      <Stack h="100%">
        <Flex direction="row" gap="md" px="md" align="center">
          {withTitle && (customTitle || <Title />)}
          {hasQuestionChanges && withResetButton && <ResetButton />}
        </Flex>

        <FilterHeader />
        <ContextualInteractiveQuestion height={height} />
      </Stack>
    </Box>
  );
};

export const InteractiveQuestion = InteractiveQuestionWrapper;
