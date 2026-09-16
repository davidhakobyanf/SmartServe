import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const sharedProps = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  focusable: false,
  'aria-hidden': true,
};

export function PlusIcon({ style, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} style={{ display: 'block', flex: 'none', ...style }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function LanguageIcon({ style, ...props }: IconProps) {
  return (
    <svg {...sharedProps} {...props} style={{ display: 'block', flex: 'none', ...style }}>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
  );
}
