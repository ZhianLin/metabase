import { FilterContent, useFilterState } from "metabase/querying";
import { Modal } from "metabase/ui";
import type * as Lib from "metabase-lib";

import { ModalBody, ModalFooter, ModalHeader } from "./FilterModal.styled";
import { getModalTitle, getModalWidth } from "./modal";

interface FilterModalProps {
  query: Lib.Query;
  onSubmit: (newQuery: Lib.Query) => void;
  onClose: () => void;
}

export function FilterModal({
  query: initialQuery,
  onSubmit,
  onClose,
}: FilterModalProps) {
  const {
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
  } = useFilterState({
    initialQuery: initialQuery,
    onSubmit: onSubmit,
    onClose: onClose,
  });

  return (
    <Modal.Root opened size={getModalWidth(groupItems)} onClose={onClose}>
      <Modal.Overlay />
      <Modal.Content>
        <ModalHeader p="lg">
          <Modal.Title>{getModalTitle(groupItems)}</Modal.Title>
          <FilterContent.Header
            searchText={searchText}
            handleSearch={handleSearch}
          />
          <Modal.CloseButton />
        </ModalHeader>
        <ModalBody p={0}>
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
        </ModalBody>
        <ModalFooter p="md" direction="row" justify="space-between">
          <FilterContent.Footer
            canRemoveFilters={canRemoveFilters}
            isChanged={isChanged}
            handleReset={handleReset}
            handleSubmit={handleSubmit}
          />
        </ModalFooter>
      </Modal.Content>
    </Modal.Root>
  );
}
