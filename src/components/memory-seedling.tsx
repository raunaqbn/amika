import type { CSSProperties, HTMLAttributes } from 'react';

type SeedlingPose = 'rest' | 'peek' | 'hold' | 'listen' | 'celebrate' | 'mark';

type MemorySeedlingProps = HTMLAttributes<HTMLSpanElement> & {
  pose?: SeedlingPose;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  bodyColor?: string;
  leafColor?: string;
  label?: string;
};

export function MemorySeedling({
  pose = 'rest',
  size = 'md',
  animated = false,
  bodyColor,
  leafColor,
  label,
  className = '',
  style,
  ...props
}: MemorySeedlingProps) {
  const colorStyle = {
    '--seedling-body': bodyColor,
    '--seedling-leaf': leafColor,
    ...style,
  } as CSSProperties;

  return (
    <span
      className={`memory-seedling memory-seedling--${pose} memory-seedling--${size} ${animated ? 'is-animated' : ''} ${className}`.trim()}
      style={colorStyle}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <span className="memory-seedling__leaf" />
      <span className="memory-seedling__stem" />
      <span className="memory-seedling__body">
        <span className="memory-seedling__eye memory-seedling__eye--left" />
        <span className="memory-seedling__eye memory-seedling__eye--right" />
        <span className="memory-seedling__smile" />
      </span>
      <span className="memory-seedling__memory" />
      <span className="memory-seedling__echo memory-seedling__echo--one" />
      <span className="memory-seedling__echo memory-seedling__echo--two" />
    </span>
  );
}

export function MemorySavedCelebration({ friendName }: { friendName?: string }) {
  return (
    <div className="memory-save-celebration" role="status" aria-live="polite" aria-atomic="true">
      <div className="memory-save-celebration__halo" aria-hidden="true" />
      <div className="memory-save-celebration__card">
        <MemorySeedling pose="celebrate" size="xl" animated />
        <div>
          <strong>Memory tucked in</strong>
          <span>{friendName ? `Saved with ${friendName}` : 'Saved to your memories'}</span>
        </div>
      </div>
    </div>
  );
}
