import styled from "@emotion/styled";

const Section = styled.section`
  padding: 1.5rem;
`;
export const SectionTitle = styled.h3`
  font-weight: 900;
  margin-bottom: 1rem;
`;
export const AggregationsContainer = styled(Section)`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  padding-top: 0;
`;
export const ColumnListContainer = styled(Section)`
  border-top: 1px solid var(--mb-color-border);
`;
