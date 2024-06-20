import { t } from "ttag";

import { Button, Icon, Stack, Text } from "metabase/ui";
import type * as Lib from "metabase-lib";

import { FilterSearchInput } from "./FilterSearchInput";
import { TabContent } from "./TabContent";
import type { GroupItem } from "./types";

const FilterContentHeader = ({
  searchText,
  handleSearch,
}: {
  searchText: string;
  handleSearch: (searchText: string) => void;
}) => {
  return <FilterSearchInput searchText={searchText} onChange={handleSearch} />;
};

const FilterContentBody = ({
  visibleItems,
  query,
  tab,
  version,
  isSearching,
  handleChange,
  handleInput,
  setTab,
}: {
  visibleItems: GroupItem[];
  query: Lib.Query;
  tab: string | null;
  version: number;
  isSearching: boolean;
  handleChange: (newQuery: Lib.Query) => void;
  handleInput: () => void;
  setTab: (tab: string | null) => void;
}) => {
  return visibleItems.length > 0 ? (
    <TabContent
      query={query}
      groupItems={visibleItems}
      tab={tab}
      version={version}
      isSearching={isSearching}
      onChange={handleChange}
      onInput={handleInput}
      onTabChange={setTab}
    />
  ) : (
    <SearchEmptyState />
  );
};
const FilterContentFooter = ({
  canRemoveFilters,
  isChanged,
  handleReset,
  handleSubmit,
}: {
  canRemoveFilters: boolean;
  isChanged: boolean;
  handleReset: () => void;
  handleSubmit: () => void;
}) => {
  return (
    <>
      <Button
        variant="subtle"
        color="text-medium"
        disabled={!canRemoveFilters}
        onClick={handleReset}
      >
        {t`Clear all filters`}
      </Button>
      <Button
        variant="filled"
        disabled={!isChanged}
        data-testid="apply-filters"
        onClick={handleSubmit}
      >
        {t`Apply filters`}
      </Button>
    </>
  );
};
export const FilterContent = {
  Header: FilterContentHeader,
  Body: FilterContentBody,
  Footer: FilterContentFooter,
};

function SearchEmptyState() {
  return (
    <Stack c="text-light" h="100%" justify="center" align="center">
      <Icon name="search" size={40} />
      <Text c="text-medium" mt="lg" fw="bold">{t`Didn't find anything`}</Text>
    </Stack>
  );
}
