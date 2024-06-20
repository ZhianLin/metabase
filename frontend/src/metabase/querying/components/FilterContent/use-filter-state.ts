import { useMemo, useState } from "react";

import * as Lib from "metabase-lib";

import { SEARCH_KEY } from "./constants";
import type { GroupItem } from "./types";
import {
  appendStageIfAggregated,
  getGroupItems,
  hasFilters,
  isSearchActive,
  removeFilters,
  searchGroupItems,
} from "./utils";

export type UseFilterStateProps = {
  initialQuery: Lib.Query;
  onSubmit: (newQuery: Lib.Query) => void;
  onClose: () => void;
};

export type UseFilterStateReturn = {
  query: Lib.Query;
  version: number;
  isChanged: boolean;
  groupItems: GroupItem[];
  tab: string | null;
  setTab: (tab: string | null) => void;
  canRemoveFilters: boolean;
  searchText: string;
  isSearching: boolean;
  visibleItems: GroupItem[];
  handleInput: () => void;
  handleChange: (newQuery: Lib.Query) => void;
  handleReset: () => void;
  handleSubmit: () => void;
  handleSearch: (searchText: string) => void;
};

export const useFilterState = ({
  initialQuery,
  onSubmit,
  onClose,
}: UseFilterStateProps): UseFilterStateReturn => {
  const [query, setQuery] = useState(() =>
    appendStageIfAggregated(initialQuery),
  );
  const [version, setVersion] = useState(1);
  const [isChanged, setIsChanged] = useState(false);
  const groupItems = useMemo(() => getGroupItems(query), [query]);
  const [tab, setTab] = useState<string | null>(groupItems[0]?.key);
  const canRemoveFilters = useMemo(() => hasFilters(query), [query]);
  const [searchText, setSearchText] = useState("");
  const isSearching = isSearchActive(searchText);

  const visibleItems = useMemo(
    () => (isSearching ? searchGroupItems(groupItems, searchText) : groupItems),
    [groupItems, searchText, isSearching],
  );

  const handleInput = () => {
    if (!isChanged) {
      setIsChanged(true);
    }
  };

  const handleChange = (newQuery: Lib.Query) => {
    setQuery(newQuery);
    setIsChanged(true);
  };

  const handleReset = () => {
    setQuery(removeFilters(query));
    setVersion(version + 1);
    setIsChanged(true);
  };

  const handleSubmit = () => {
    onSubmit(Lib.dropEmptyStages(query));
    onClose();
  };

  const handleSearch = (searchText: string) => {
    setTab(isSearchActive(searchText) ? SEARCH_KEY : groupItems[0]?.key);
    setSearchText(searchText);
  };
  return {
    query,
    version,
    isChanged,
    groupItems,
    tab,
    setTab,
    canRemoveFilters,
    searchText,
    isSearching,
    visibleItems,
    handleInput,
    handleChange,
    handleReset,
    handleSubmit,
    handleSearch,
  };
};
