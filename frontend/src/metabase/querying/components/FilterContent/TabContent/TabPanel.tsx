import type * as Lib from "metabase-lib";

import type { GroupItem } from "../types";

import { TabPanelRoot } from "./TabPanel.styled";
import { TabPanelColumnItemList } from "./TabPanelColumnItemList";
import { TabPanelSegmentItem } from "./TabPanelSegmentItem";

interface TabPanelProps {
  query: Lib.Query;
  groupItem: GroupItem;
  isSearching: boolean;
  onChange: (newQuery: Lib.Query) => void;
  onInput: () => void;
}

export function TabPanel({
  query,
  groupItem,
  isSearching,
  onChange,
  onInput,
}: TabPanelProps) {
  return (
    <TabPanelRoot value={groupItem.key}>
      <ul>
        {groupItem.segmentItems.length > 0 && (
          <TabPanelSegmentItem
            query={query}
            segmentItems={groupItem.segmentItems}
            onChange={onChange}
          />
        )}
        {groupItem.columnItems.length > 0 && (
          <TabPanelColumnItemList
            query={query}
            columnItems={groupItem.columnItems}
            isSearching={isSearching}
            onChange={onChange}
            onInput={onInput}
          />
        )}
      </ul>
    </TabPanelRoot>
  );
}
