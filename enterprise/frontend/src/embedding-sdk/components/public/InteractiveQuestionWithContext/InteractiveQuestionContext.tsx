import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type FC,
  type ReactNode,
} from "react";
import { t } from "ttag";

import type {
  SdkClickActionPluginsConfig,
  SdkPluginsConfig,
} from "embedding-sdk";
import {
  SdkError,
  withPublicComponentWrapper,
} from "embedding-sdk/components/private/PublicComponentWrapper";
import { getDefaultVizHeight } from "embedding-sdk/lib/default-height";
import { useSdkSelector } from "embedding-sdk/store";
import { getPlugins } from "embedding-sdk/store/selectors";
import { useToggle } from "metabase/hooks/use-toggle";
import { useDispatch, useSelector } from "metabase/lib/redux";
import {
  initializeQBRaw,
  updateQuestion,
} from "metabase/query_builder/actions";
import {
  getCard,
  getFirstQueryResult,
  getQueryResults,
  getQuestion,
  getUiControls,
} from "metabase/query_builder/selectors";
import { getSetting } from "metabase/selectors/settings";
import type { Mode } from "metabase/visualizations/click-actions/Mode";
import { getEmbeddingMode } from "metabase/visualizations/click-actions/lib/modes";
import * as MBLib from "metabase-lib";
import type Question from "metabase-lib/v1/Question";
import type { CardId, Card, Dataset } from "metabase-types/api";
import type { QueryBuilderUIControls } from "metabase-types/store";

type InteractiveQuestionContextProps = {
  card: Card | null;
  defaultHeight: number | undefined;
  isFilterModalOpen: boolean;
  isNotebookOpen: boolean;
  isSummarizeThingOpen: boolean;
  onCollapseFilters: () => void;
  onExpandFilters: () => void;
  onFilterModalOpen: () => void;
  onFilterModalClose: () => void;
  onNotebookOpen: () => void;
  onNotebookClose: () => void;
  onSummarizeThingOpen: () => void;
  onSummarizeThingClose: () => void;
  onQueryChange: (query: MBLib.Query) => Promise<void>;
  plugins: SdkPluginsConfig | null;
  reportTimezone: string;
  result: Dataset | null;
  question: Question;
  uiControls: QueryBuilderUIControls;
  queryResults: Dataset[] | null;
  hasQuestionChanges: boolean;
  mode: Mode | null | undefined;
  handleQuestionReset: () => void;
  areFiltersExpanded: boolean;
  isQueryRunning: boolean;
  isQuestionLoading: boolean;
};

const InteractiveQuestionContext = createContext<
  InteractiveQuestionContextProps | undefined
>(undefined);

export const InteractiveQuestionProvider: FC<{
  questionId: CardId;
  children: ReactNode;
  plugins?: SdkClickActionPluginsConfig;
}> = withPublicComponentWrapper(
  ({ questionId, children, plugins: componentPlugins }) => {
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
    const reportTimezone = useSelector(state =>
      getSetting(state, "report-timezone-long"),
    );

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isSummarizeThingOpen, setIsSummarizeThingOpen] = useState(false);
    const [isNotebookOpen, setIsNotebookOpen] = useState(false);

    const onQueryChange = async (query: MBLib.Query) => {
      if (question) {
        const nextLegacyQuery = MBLib.toLegacyQuery(query);
        const nextQuestion = question.setDatasetQuery(nextLegacyQuery);
        await dispatch(updateQuestion(nextQuestion, { run: true }));
      }
    };

    const hasQuestionChanges =
      card && (!card.id || card.id !== card.original_card_id);

    const [isQuestionLoading, setIsQuestionLoading] = useState(true);

    const { isRunning: isQueryRunning } = uiControls;

    const [
      areFiltersExpanded,
      { turnOn: onExpandFilters, turnOff: onCollapseFilters },
    ] = useToggle(!question?.isSaved());

    if (question) {
      // FIXME: remove "You can also get an alert when there are some results." feature for question
      question.alertType = () => null;
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

    if (!queryResults || !question) {
      return <SdkError message={t`Question not found`} />;
    }

    return (
      <InteractiveQuestionContext.Provider
        value={{
          card,
          defaultHeight,
          isFilterModalOpen,
          isNotebookOpen,
          isSummarizeThingOpen,
          onCollapseFilters,
          onExpandFilters,
          onFilterModalOpen: () => setIsFilterModalOpen(true),
          onFilterModalClose: () => setIsFilterModalOpen(false),
          onNotebookOpen: () => setIsNotebookOpen(true),
          onNotebookClose: () => setIsNotebookOpen(false),
          onSummarizeThingOpen: () => setIsSummarizeThingOpen(true),
          onSummarizeThingClose: () => setIsSummarizeThingOpen(false),
          onQueryChange,
          plugins,
          reportTimezone,
          result,
          question,
          uiControls,
          queryResults,
          hasQuestionChanges,
          mode,
          handleQuestionReset,
          areFiltersExpanded,
          isQueryRunning,
          isQuestionLoading,
        }}
      >
        {children}
      </InteractiveQuestionContext.Provider>
    );
  },
);

export const useInteractiveQuestionContext = () => {
  const context = useContext(InteractiveQuestionContext);
  if (context === undefined) {
    throw new Error(
      "useInteractiveQuestionContext must be used within a InteractiveQuestionProvider",
    );
  }
  return context;
};

const getQuestionParameters = (questionId: CardId) => {
  return {
    location: {
      query: {},
      hash: "",
      pathname: `/question/${questionId}`,
    },
    params: {
      slug: questionId.toString(),
    },
  };
};
