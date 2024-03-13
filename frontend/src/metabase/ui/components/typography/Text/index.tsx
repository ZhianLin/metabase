import type { TextProps as MantineTextProps } from "@mantine/core";
import { Text as MantineText } from "@mantine/core";

export type TextProps = MantineTextProps & {
  /** margin-inline-start */
  ms?: string;
  /** margin-inline-end */
  me?: string;
  /** padding-inline-start */
  ps?: string;
  /** padding-inline-end */
  pe?: string;
  /** alias for margin-inline-start, short for "Margin-Left but Direction-sensitive", */
  mld?: string;
  /** alias for margin-inline-end, short for "Margin-Right but Direction-sensitive", */
  mrd?: string;
  /** alias for padding-inline-start, short for "Padding-Left but Direction-sensitive", */
  pld?: string;
  /** alias for padding-inline-end, short for "Padding-Right but Direction-sensitive", */
  prd?: string;
};

export const Text = (props: TextProps) => {
  return (
    <MantineText
      {...props}
      style={{
        marginInlineStart: props.ms ?? props.mld,
        marginInlineEnd: props.me ?? props.mrd,
        paddingInlineStart: props.ps ?? props.pld,
        paddingInlineEnd: props.pe ?? props.prd,
        ...props.style,
      }}
    />
  );
};

export type TextComponent = typeof Text;
export { getTextOverrides } from "./Text.styled";
