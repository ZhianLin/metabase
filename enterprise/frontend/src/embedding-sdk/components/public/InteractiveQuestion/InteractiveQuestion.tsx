import cx from "classnames";
import { useCallback, useEffect, useState } from "react";
import { t } from "ttag";

import {
  withPublicComponentWrapper,
  SdkError,
} from "embedding-sdk/components/private/PublicComponentWrapper";
import { ResetButton } from "embedding-sdk/components/private/ResetButton";
import { getDefaultVizHeight } from "embedding-sdk/lib/default-height";
import type { SdkClickActionPluginsConfig } from "embedding-sdk/lib/plugins";
import { useSdkSelector } from "embedding-sdk/store";
import { getPlugins } from "embedding-sdk/store/selectors";
import CS from "metabase/css/core/index.css";
import { useToggle } from "metabase/hooks/use-toggle";
import { useDispatch, useSelector } from "metabase/lib/redux";
import {
  initializeQBRaw,
  navigateToNewCardInsideQB,
  onCloseSummary,
  onEditSummary,
  setQueryBuilderMode,
  updateQuestion,
} from "metabase/query_builder/actions";
import QueryVisualization from "metabase/query_builder/components/QueryVisualization";
import { ViewHeaderIconButtonContainer } from "metabase/query_builder/components/view/ViewHeader/ViewHeader.styled";
import {
  FilterHeader,
  FilterHeaderButton,
  FilterHeaderToggle,
  QuestionNotebookButton,
  QuestionSummarizeWidget,
} from "metabase/query_builder/components/view/ViewHeader/components";
import { MODAL_TYPES } from "metabase/query_builder/constants";
import {
  getCard,
  getFirstQueryResult,
  getQueryResults,
  getQuestion,
  getUiControls,
} from "metabase/query_builder/selectors";
import { Flex, Group, Stack, Box, Loader } from "metabase/ui";
import { getEmbeddingMode } from "metabase/visualizations/click-actions/lib/modes";
import type { CardId } from "metabase-types/api";
import type { QueryBuilderMode } from "metabase-types/store";

const returnNull = () => null;

interface InteractiveQuestionProps {
  questionId: CardId;
  withResetButton?: boolean;
  withTitle?: boolean;
  customTitle?: React.ReactNode;
  plugins?: SdkClickActionPluginsConfig;
  height?: string | number;
}

export const _InteractiveQuestion = ({
  questionId,
  withResetButton = true,
  withTitle = false,
  customTitle,
  plugins: componentPlugins,
  height,
}: InteractiveQuestionProps): JSX.Element | null => {
  const globalPlugins = useSdkSelector(getPlugins);

  const dispatch = useDispatch();
  const question = useSelector(getQuestion);
  const plugins = componentPlugins || globalPlugins;
  const mode = question && getEmbeddingMode(question, plugins || undefined);
  const card = useSelector(getCard);
  const result = useSelector(getFirstQueryResult);
  const uiControls = useSelector(getUiControls);
  const queryResults = useSelector(getQueryResults);
  const defaultHeight = card ? getDefaultVizHeight(card.display) : undefined;

  const hasQuestionChanges =
    card && (!card.id || card.id !== card.original_card_id);

  const [isQuestionLoading, setIsQuestionLoading] = useState(true);

  const { isRunning: isQueryRunning } = uiControls;

  const [
    areFiltersExpanded,
    { turnOn: onExpandFilters, turnOff: onCollapseFilters },
  ] = useToggle(!question?.isSaved());

  const [_, setOpenModal] = useState<string>();

  if (question) {
    // FIXME: remove "You can also get an alert when there are some results." feature for question
    question.alertType = returnNull;
  }

  const loadQuestion = async (
    dispatch: ReturnType<typeof useDispatch>,
    questionId: CardId,
  ) => {
    setIsQuestionLoading(true);

    const { location, params } = getQuestionParameters(questionId);
    try {
      await dispatch(initializeQBRaw(location, params));
    } catch (e) {
      console.error(`Failed to get question`, e);
      setIsQuestionLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion(dispatch, questionId);
  }, [dispatch, questionId]);

  const handleQuestionReset = useCallback(() => {
    loadQuestion(dispatch, questionId);
  }, [dispatch, questionId]);

  useEffect(() => {
    if (queryResults) {
      setIsQuestionLoading(false);
    }
  }, [queryResults]);

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
        <Flex direction="row" gap="md" px="md" align="center">
          {withTitle &&
            (customTitle || (
              <h2 className={cx(CS.h2, CS.textWrap)}>
                {question.displayName()}
              </h2>
            ))}

          {hasQuestionChanges && withResetButton && (
            <ResetButton onClick={handleQuestionReset} />
          )}
        </Flex>

        {FilterHeader.shouldRender({
          question,
          queryBuilderMode: uiControls.queryBuilderMode,
          isObjectDetail: false,
        }) && (
          <FilterHeader
            expanded
            question={question}
            updateQuestion={(...args) => dispatch(updateQuestion(...args))}
          />
        )}
        {FilterHeaderToggle.shouldRender({
          question,
          queryBuilderMode: uiControls.queryBuilderMode,
          isObjectDetail: false,
        }) && (
          <FilterHeaderToggle
            className={cx(CS.ml2, CS.mr1)}
            query={question.query()}
            isExpanded={areFiltersExpanded}
            onExpand={onExpandFilters}
            onCollapse={onCollapseFilters}
          />
        )}
        {FilterHeaderButton.shouldRender({
          question,
          queryBuilderMode: uiControls.queryBuilderMode,
          isObjectDetail: false,
          isActionListVisible: true,
        }) && (
          <FilterHeaderButton
            className={cx(CS.hide, CS.smShow)}
            onOpenModal={() => setOpenModal(MODAL_TYPES.FILTERS)}
          />
        )}
        {QuestionSummarizeWidget.shouldRender({
          question,
          queryBuilderMode: uiControls.queryBuilderMode,
          isObjectDetail: false,
          isActionListVisible: true,
        }) && (
          <QuestionSummarizeWidget
            className={cx(CS.hide, CS.smShow)}
            isShowingSummarySidebar={uiControls.isShowingSummarySidebar}
            onEditSummary={() => dispatch(onEditSummary())}
            onCloseSummary={() => dispatch(onCloseSummary())}
          />
        )}
        {QuestionNotebookButton.shouldRender({
          question,
          isActionListVisible: true,
        }) && (
          <ViewHeaderIconButtonContainer>
            <QuestionNotebookButton
              iconSize={16}
              question={question}
              isShowingNotebook={uiControls.queryBuilderMode === "notebook"}
              setQueryBuilderMode={(mode: QueryBuilderMode) =>
                setQueryBuilderMode(mode)
              }
            />
          </ViewHeaderIconButtonContainer>
        )}
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

export const InteractiveQuestion =
  withPublicComponentWrapper(_InteractiveQuestion);

const getQuestionParameters = (questionId: CardId) => {
  return {
    location: {
      query: {}, // TODO: add here wrapped parameterValues
      hash: "",
      pathname: `/question/${questionId}`,
    },
    params: {
      slug: questionId.toString(),
    },
  };
};
