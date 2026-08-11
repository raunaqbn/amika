import type { CSSProperties, HTMLAttributes } from 'react';

type PebblePose = 'lean' | 'cradle' | 'stack' | 'peek' | 'apart' | 'rest' | 'celebrate' | 'mark';

type PebblePairProps = HTMLAttributes<HTMLSpanElement> & {
  pose?: PebblePose;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  largeColor?: string;
  smallColor?: string;
  label?: string;
};

export function PebblePair({
  pose = 'lean',
  size = 'md',
  animated = false,
  largeColor,
  smallColor,
  label,
  className = '',
  style,
  ...props
}: PebblePairProps) {
  const colorStyle = {
    '--pebble-large': largeColor,
    '--pebble-small': smallColor,
    ...style,
  } as CSSProperties;

  return (
    <span
      className={`pebble-pair pebble-pair--${pose} pebble-pair--${size} ${animated ? 'is-animated' : ''} ${className}`.trim()}
      style={colorStyle}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <span className="pebble-pair__large">
        <span className="pebble-pair__face pebble-pair__face--large">
          <span className="pebble-pair__eye pebble-pair__eye--left" />
          <span className="pebble-pair__eye pebble-pair__eye--right" />
          <span className="pebble-pair__smile" />
          <span className="pebble-pair__cheek" />
        </span>
      </span>
      <span className="pebble-pair__small">
        <span className="pebble-pair__face pebble-pair__face--small">
          <span className="pebble-pair__eye pebble-pair__eye--left" />
          <span className="pebble-pair__eye pebble-pair__eye--right" />
          <span className="pebble-pair__smile" />
          <span className="pebble-pair__cheek" />
        </span>
      </span>
      <span className="pebble-pair__echo" />
    </span>
  );
}

export function MemorySavedCelebration({ friendName }: { friendName?: string }) {
  return (
    <div className="memory-save-celebration" role="status" aria-live="polite" aria-atomic="true">
      <div className="memory-save-celebration__halo" aria-hidden="true" />
      <div className="memory-save-celebration__card">
        <PebblePair pose="celebrate" size="xl" animated />
        <div>
          <strong>Memory tucked in</strong>
          <span>{friendName ? `Saved with ${friendName}` : 'Saved to your memories'}</span>
        </div>
      </div>
    </div>
  );
}
