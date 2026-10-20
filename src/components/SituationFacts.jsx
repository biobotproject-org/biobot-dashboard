import { ArrowUp, Satellite, Wind, Flame } from 'lucide-react';
import { cn } from '../utils/utils';
import { windText, kmText, horizon, compass, satelliteText } from '../utils/situation';

// Wind, the 60-minute spread reach, and the satellite cross-check for one
// incident, as three short lines. Used on the live map and the incident page.
const SituationFacts = ({ context, className }) => {
  if (!context) return null;
  const { weather, spread, satellite } = context;
  const wind = windText(weather);
  const hour = horizon(spread, 60);
  const sat = satelliteText(satellite);
  const satHit = satellite?.status === 'ok' && (satellite.nearest || satellite.hotspots?.length);

  return (
    <div className={cn('flex flex-col gap-1.5 text-[13px]', className)}>
      <div className="flex items-center gap-2 text-text2">
        <Wind size={14} className="text-text3 shrink-0" />
        {wind ? (
          <>
            <span>Wind {wind}</span>
            {spread && (
              <ArrowUp
                size={14}
                className="text-accent shrink-0"
                style={{ transform: `rotate(${spread.headingDeg}deg)` }}
                aria-label={`blowing toward ${compass(spread.headingDeg)}`}
              />
            )}
          </>
        ) : <span className="text-text3">Wind unavailable</span>}
      </div>
      {hour && (
        <div className="flex items-center gap-2 text-text2">
          <Flame size={14} className="text-orange-400 shrink-0" />
          <span>
            If fire: up to <span className="text-text font-semibold">{kmText(hour.headKm)}</span> {compass(spread.headingDeg)} in 1 h
          </span>
        </div>
      )}
      {sat && (
        <div className={cn('flex items-center gap-2', satHit ? 'text-amber-300 font-medium' : 'text-text3')}>
          <Satellite size={14} className="shrink-0" />
          <span>{sat}</span>
        </div>
      )}
    </div>
  );
};

export default SituationFacts;
