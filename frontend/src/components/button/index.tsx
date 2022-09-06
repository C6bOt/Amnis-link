import React from "react";
import cx from "classnames";
import styles from "./Button.module.css";

export type ButtonTheme = "default" | "gray";

export type ButtonSize = "md" | "sm" | "text";

export const DEFAULT_THEME = "default";
export const DEFAULT_SIZE = "md";

export type ButtonProps = {
  className?: string;
  theme?: ButtonTheme;
  size?: ButtonSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  underlined?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      icon,
      size = DEFAULT_SIZE,
      theme = DEFAULT_THEME,
      disabled,
      underlined,
      onClick,
      ...props
    },
    ref,
  ) => (
    // eslint-disable-next-line react/button-has-type
    <button
      ref={ref}
      className={cx(
        styles.button,
        styles[underlined ? `underlined-${theme}` : theme],
        styles[size],
        { [styles.hasIcon]: icon },
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
);
