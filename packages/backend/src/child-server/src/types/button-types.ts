export interface ButtonStyleConfig {
  textColor: string;
  fontSize: string;
  borderRadius: string;
  paddingX: string;
  paddingY: string;
  borderColor: string;
  borderWidth: string;
  backgroundColor: string;
  hoveredBackgroundColor: string;
  hoveredTextColor: string;
  isHovered: boolean;
}

export interface RadioButtonStyleConfig {
  height: string;
  width: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  borderColorChecked: string;
  color: string;
  customIcon: {
    height: string;
    width: string;
    backgroundColor: string;
    borderRadius: string;
  };
}

export interface SegmentedButtonProps {
  buttonLabels: string[];
  activeBgColor?: string;
  inactiveBgColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
}

export type ButtonType =
  | "primary"
  | "secondary"
  | "outlined"
  | "radioButton"
  | "ghost"
  | "";
