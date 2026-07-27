const LIP_SHAPES = {
  spread:   { upper: 'M30,58 Q75,48 120,58', lower: 'M30,62 Q75,82 120,62', outerTop: 'M26,56 Q75,44 124,56', outerBot: 'M26,64 Q75,88 124,64' },
  open:     { upper: 'M30,56 Q75,50 120,56', lower: 'M30,64 Q75,84 120,64', outerTop: 'M26,54 Q75,46 124,54', outerBot: 'M26,66 Q75,90 124,66' },
  rounded:  { upper: 'M42,56 Q75,50 108,56', lower: 'M42,64 Q75,80 108,64', outerTop: 'M38,54 Q75,46 112,54', outerBot: 'M38,66 Q75,84 112,66' },
  together: { upper: 'M42,58 Q75,54 108,58', lower: 'M42,62 Q75,68 108,62', outerTop: 'M38,56 Q75,50 112,56', outerBot: 'M38,64 Q75,72 112,64' },
};

const TEETH_VISIBILITY = {
  bilabial: false,
  labiodental: 'upper',
  dental: 'both',
  alveolar: 'upper',
  postalveolar: 'upper',
  palatal: false,
  velar: false,
  glottal: false,
};

const TONGUE_CONFIGS = {
  'neutral':            { visible: false },
  'tip-to-ridge':       { visible: true, path: 'M50,72 Q65,62 75,58 Q85,62 100,72', label: 'Tongue tip touches the ridge behind your teeth' },
  'tip-near-ridge':     { visible: true, path: 'M50,72 Q65,64 75,60 Q85,64 100,72', label: 'Tongue tip near the ridge' },
  'tip-between-teeth':  { visible: true, path: 'M55,66 Q70,54 75,50 Q80,54 95,66', label: 'Tongue tip peeks between teeth', tipVisible: true },
  'tip-curled-back':    { visible: true, path: 'M50,72 Q65,64 72,60 Q75,58 78,60 Q85,64 100,72', label: 'Tongue tip curled back' },
  'blade-behind-ridge': { visible: true, path: 'M48,72 Q62,62 75,56 Q88,62 102,72', label: 'Tongue blade raised' },
  'back-raised':        { visible: true, path: 'M55,72 Q68,70 75,68 Q82,66 95,60', label: 'Back of tongue raised' },
  'body-to-palate':     { visible: true, path: 'M50,72 Q65,62 75,56 Q85,62 100,72', label: 'Tongue body raised to palate' },
  'high-front':         { visible: true, path: 'M48,72 Q60,60 75,58 Q90,62 102,72', label: 'Tongue high and forward' },
  'mid-front':          { visible: true, path: 'M50,72 Q62,64 75,62 Q88,64 100,72', label: 'Tongue mid-height, forward' },
  'low-front':          { visible: false },
  'high-central':       { visible: true, path: 'M50,72 Q65,60 75,56 Q85,60 100,72', label: 'Tongue high and centered' },
  'mid-central':        { visible: false },
  'low-central':        { visible: false },
  'high-back':          { visible: true, path: 'M55,72 Q68,70 75,66 Q82,60 95,56', label: 'Tongue high and back' },
  'mid-back':           { visible: true, path: 'M55,72 Q68,70 75,68 Q82,64 95,62', label: 'Tongue mid-height, back' },
  'low-back':           { visible: false },
};

const ZONE_LABELS = {
  bilabial:      'Both lips press together',
  labiodental:   'Lower lip touches upper teeth',
  dental:        'Tongue tip between or near teeth',
  alveolar:      'Tongue tip at the ridge behind teeth',
  postalveolar:  'Tongue blade behind the ridge',
  palatal:       'Tongue body near the roof of mouth',
  velar:         'Back of tongue at the soft palate',
  glottal:       'Air from the throat',
};

export default function MouthDiagram({ phonemeData }) {
  if (!phonemeData) return null;

  const { type, zone, tongue, lips } = phonemeData;
  const lipShape = LIP_SHAPES[lips] || LIP_SHAPES['open'];
  const teethMode = zone ? TEETH_VISIBILITY[zone] : (type === 'vowel' ? false : false);
  const tongueConfig = TONGUE_CONFIGS[tongue] || TONGUE_CONFIGS['neutral'];
  const zoneLabel = zone ? ZONE_LABELS[zone] : null;

  const showTeethTop = teethMode === 'upper' || teethMode === 'both';
  const showTeethBot = teethMode === 'both';

  return (
    <div className="w-full">
      <svg viewBox="0 0 150 110" className="w-full max-w-[280px] mx-auto" aria-hidden="true">
        {/* Face outline - cheeks and jaw */}
        <ellipse cx="75" cy="52" rx="68" ry="50" fill="#fef3c7" fillOpacity="0.3" stroke="#e5e7eb" strokeWidth="1" />

        {/* Nose hint */}
        <path d="M68,18 Q75,22 82,18" fill="none" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" />

        {/* Lip outer shape */}
        <path d={lipShape.outerTop} fill="#fca5a5" fillOpacity="0.4" stroke="none" />
        <path d={lipShape.outerBot} fill="#fca5a5" fillOpacity="0.4" stroke="none" />

        {/* Lip lines */}
        <path d={lipShape.upper} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <path d={lipShape.lower} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

        {/* Mouth interior */}
        <path
          d={`${lipShape.upper} L120,60 Q75,60 30,60 Z`}
          fill="#1f2937" fillOpacity="0.08"
        />
        <path
          d={`${lipShape.lower} L120,60 Q75,60 30,60 Z`}
          fill="#1f2937" fillOpacity="0.12"
        />

        {/* Upper teeth */}
        {showTeethTop && (
          <g>
            {[38, 48, 58, 66, 74, 82, 90, 98, 108].map((x, i) => (
              <rect key={i} x={x} y="54" width="7" height="6" rx="1"
                fill="white" stroke="#d1d5db" strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {/* Lower teeth */}
        {showTeethBot && (
          <g>
            {[40, 50, 59, 67, 75, 83, 91, 100].map((x, i) => (
              <rect key={i} x={x} y="62" width="7" height="5" rx="1"
                fill="white" stroke="#d1d5db" strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {/* Tongue */}
        {tongueConfig.visible && tongueConfig.path && (
          <path d={tongueConfig.path}
            fill="#f87171" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
          />
        )}

        {/* Tongue tip peeking between teeth (dental) */}
        {tongueConfig.tipVisible && (
          <ellipse cx="75" cy="54" rx="8" ry="4" fill="#f87171" fillOpacity="0.6" stroke="#ef4444" strokeWidth="1" />
        )}

        {/* Zone highlight indicators */}
        {zone === 'bilabial' && (
          <>
            <circle cx="30" cy="60" r="4" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="120" cy="60" r="4" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="1.5" />
          </>
        )}
        {zone === 'labiodental' && (
          <>
            <line x1="35" y1="62" x2="45" y2="58" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <line x1="105" y1="62" x2="115" y2="58" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {(zone === 'dental' || zone === 'alveolar' || zone === 'postalveolar') && (
          <circle cx="75" cy="56" r="10" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
        )}
        {zone === 'glottal' && (
          <path d="M65,90 Q75,85 85,90" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>

      {/* Zone / tongue label below diagram */}
      {(zoneLabel || tongueConfig.label) && (
        <p className="text-xs text-blue-600 text-center mt-1 leading-tight">
          {zoneLabel || tongueConfig.label}
        </p>
      )}
    </div>
  );
}
