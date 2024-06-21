import { useInteractiveQuestionContext } from "embedding-sdk/components/public/InteractiveQuestionWithContext/InteractiveQuestionContext";
import { FilterContent, useFilterState } from "metabase/querying";
import { Stack } from "metabase/ui";
import type Question from "metabase-lib/v1/Question";

export const Filter = () => {
  const { isFilterModalOpen, onFilterModalClose, onQueryChange, question } =
    useInteractiveQuestionContext();

  return question && isFilterModalOpen ? (
    <FilterInner
      question={question}
      onQueryChange={onQueryChange}
      onFilterModalClose={onFilterModalClose}
      isFilterModalOpen={isFilterModalOpen}
    />
  ) : null;
};

export const FilterInner = ({
  question,
  onQueryChange,
  onFilterModalClose,
}: {
  question: Question;
  onQueryChange: (...args: any[]) => void;
  onFilterModalClose: () => void;
  isFilterModalOpen: boolean;
}) => {
  const {
    canRemoveFilters,
    handleChange,
    handleInput,
    handleReset,
    handleSearch,
    handleSubmit,
    isChanged,
    isSearching,
    query,
    searchText,
    setTab,
    tab,
    version,
    visibleItems,
  } = useFilterState({
    initialQuery: question.query(),
    onSubmit: onQueryChange,
    onClose: onFilterModalClose,
  });

  return question ? (
    <Stack>
      <FilterContent.Header
        searchText={searchText}
        handleSearch={handleSearch}
      />
      <FilterContent.Body
        visibleItems={visibleItems}
        query={query}
        tab={tab}
        version={version}
        isSearching={isSearching}
        handleChange={handleChange}
        handleInput={handleInput}
        setTab={setTab}
      />
      <FilterContent.Footer
        canRemoveFilters={canRemoveFilters}
        isChanged={isChanged}
        handleReset={handleReset}
        handleSubmit={handleSubmit}
      />
    </Stack>
  ) : null;
};
