const ZONE_PATHS = {
  bilabial: { d: 'M28,82 Q24,78 24,74 Q24,70 28,67 L32,67 Q36,70 36,74 Q36,78 32,82 Z', label: 'Lips', lx: 14, ly: 75 },
  labiodental: { d: 'M36,68 L44,64 L44,68 L36,72 Z', label: 'Lip+Teeth', lx: 10, ly: 62 },
  dental: { d: 'M44,62 L54,58 L54,64 L44,68 Z', label: 'Teeth', lx: 40, ly: 54 },
  alveolar: { d: 'M54,56 Q62,50 68,48 L68,54 Q62,56 54,62 Z', label: 'Ridge', lx: 54, ly: 44 },
  postalveolar: { d: 'M68,46 Q76,42 82,40 L82,46 Q76,48 68,52 Z', label: 'Behind ridge', lx: 68, ly: 36 },
  palatal: { d: 'M82,38 Q92,34 102,34 L102,40 Q92,40 82,44 Z', label: 'Hard palate', lx: 82, ly: 30 },
  velar: { d: 'M102,34 Q116,34 126,40 L126,46 Q116,40 102,40 Z', label: 'Soft palate', lx: 104, ly: 28 },
  glottal: { d: 'M134,80 Q138,74 138,68 Q138,62 134,56 L140,56 Q144,62 144,68 Q144,74 140,80 Z', label: 'Throat', lx: 142, ly: 68 },
};

const TONGUE_PATHS = {
  'neutral':            'M42,100 Q60,88 80,84 Q100,80 120,82 Q130,84 136,90',
  'tip-to-ridge':       'M42,100 Q48,80 58,68 Q64,58 68,54 Q80,60 100,78 Q120,82 136,90',
  'tip-near-ridge':     'M42,100 Q50,82 60,72 Q66,62 70,60 Q82,64 100,78 Q120,82 136,90',
  'tip-between-teeth':  'M42,100 Q44,86 46,78 Q48,72 44,66 Q60,70 90,80 Q115,82 136,90',
  'tip-curled-back':    'M42,100 Q52,82 64,72 Q72,66 76,62 Q74,58 70,56 Q90,68 110,80 Q125,84 136,90',
  'blade-behind-ridge': 'M42,100 Q54,82 66,70 Q74,58 80,50 Q90,56 105,74 Q120,82 136,90',
  'back-raised':        'M42,100 Q58,90 76,86 Q96,76 112,58 Q120,46 126,42 Q132,56 136,90',
  'body-to-palate':     'M42,100 Q56,86 72,76 Q88,58 98,44 Q106,38 112,42 Q124,60 136,90',
  'high-front':         'M42,100 Q48,78 56,66 Q64,56 72,52 Q84,54 100,72 Q120,82 136,90',
  'mid-front':          'M42,100 Q52,84 64,74 Q74,66 80,64 Q92,68 106,78 Q122,84 136,90',
  'low-front':          'M42,100 Q56,90 68,84 Q78,80 84,80 Q96,80 108,82 Q124,86 136,90',
  'high-central':       'M42,100 Q56,84 72,70 Q84,56 92,50 Q100,52 112,64 Q126,80 136,90',
  'mid-central':        'M42,100 Q58,86 76,78 Q90,72 98,70 Q106,72 116,78 Q128,84 136,90',
  'low-central':        'M42,100 Q60,92 78,88 Q92,86 100,86 Q108,86 118,88 Q130,90 136,92',
  'high-back':          'M42,100 Q58,90 76,86 Q92,82 106,70 Q116,56 124,50 Q130,58 136,90',
  'mid-back':           'M42,100 Q58,90 76,86 Q92,82 106,76 Q116,68 124,64 Q132,72 136,90',
  'low-back':           'M42,100 Q60,92 78,88 Q94,86 108,84 Q118,80 126,78 Q134,84 136,92',
};

const VOWEL_POSITIONS = {
  'high-front':   { cx: 64, cy: 56 },
  'high-central': { cx: 90, cy: 52 },
  'high-back':    { cx: 118, cy: 54 },
  'mid-front':    { cx: 72, cy: 68 },
  'mid-central':  { cx: 94, cy: 72 },
  'mid-back':     { cx: 116, cy: 68 },
  'low-front':    { cx: 78, cy: 82 },
  'low-central':  { cx: 96, cy: 86 },
  'low-back':     { cx: 116, cy: 82 },
};

function getDiphthongPositions(tongue) {
  const parts = tongue.split('-to-');
  if (parts.length !== 2) return null;
  const from = VOWEL_POSITIONS[parts[0]];
  const to = VOWEL_POSITIONS[parts[1]];
  if (!from || !to) return null;
  return { from, to };
}

export default function MouthDiagram({ phonemeData }) {
  if (!phonemeData) return null;

  const { type, zone, tongue, lips } = phonemeData;
  const tonguePath = TONGUE_PATHS[tongue] || TONGUE_PATHS['neutral'];
  const activeZone = zone && ZONE_PATHS[zone] ? zone : null;

  const isRounded = lips === 'rounded' || lips === 'together';
  const lipGap = isRounded ? 3 : 8;

  let vowelDot = null;
  let diphthongArrow = null;
  if (type === 'vowel' && tongue && VOWEL_POSITIONS[tongue]) {
    vowelDot = VOWEL_POSITIONS[tongue];
  } else if (type === 'diphthong' && tongue) {
    diphthongArrow = getDiphthongPositions(tongue);
  }

  return (
    <svg viewBox="0 0 170 130" width="160" height="124" className="mx-auto" aria-hidden="true">
      {/* Head profile outline */}
      <path
        d="M60,10 Q50,10 44,16 L38,26 Q34,32 30,36 L26,40 Q22,44 22,50
           L22,60 Q22,66 26,70 L28,72
           Q24,72 24,74 Q24,76 28,78 L28,80 Q24,80 24,82
           Q24,86 30,88 L36,88
           Q34,92 34,96 Q34,102 40,108 L46,112
           Q54,116 64,118 L70,118"
        fill="none" stroke="#d1d5db" strokeWidth="1.5"
      />
      {/* Upper palate + alveolar ridge */}
      <path
        d="M44,64 Q48,60 54,58 Q62,54 68,52 Q76,48 82,46
           Q92,40 102,38 Q112,36 122,38 Q130,40 134,46"
        fill="none" stroke="#9ca3af" strokeWidth="1.5"
      />
      {/* Soft palate / velum */}
      <path
        d="M122,38 Q130,40 134,46 Q138,54 138,62 L138,80"
        fill="none" stroke="#9ca3af" strokeWidth="1.2" strokeDasharray="3,2"
      />
      {/* Upper teeth */}
      <line x1="44" y1="64" x2="44" y2="70" stroke="#9ca3af" strokeWidth="2" />
      {/* Lower teeth */}
      <line x1="42" y1="96" x2="42" y2="102" stroke="#9ca3af" strokeWidth="2" />
      {/* Lower jaw */}
      <path
        d="M42,102 Q46,108 54,112 Q64,116 70,118"
        fill="none" stroke="#d1d5db" strokeWidth="1.5"
      />
      {/* Lip markers */}
      <circle cx="30" cy={74 - lipGap / 2} r="2.5" fill="#d1d5db" />
      <circle cx="30" cy={74 + lipGap / 2 + 4} r="2.5" fill="#d1d5db" />

      {/* Zone highlight */}
      {activeZone && (
        <path
          d={ZONE_PATHS[activeZone].d}
          fill="#3b82f6" fillOpacity="0.25"
          stroke="#3b82f6" strokeWidth="1.5"
        />
      )}

      {/* Zone label */}
      {activeZone && (
        <text
          x={ZONE_PATHS[activeZone].lx} y={ZONE_PATHS[activeZone].ly}
          fontSize="7" fill="#3b82f6" fontWeight="600" textAnchor="end"
        >
          {ZONE_PATHS[activeZone].label}
        </text>
      )}

      {/* Tongue */}
      <path
        d={tonguePath}
        fill="#fca5a5" fillOpacity="0.5"
        stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"
      />

      {/* Vowel position dot */}
      {vowelDot && (
        <circle cx={vowelDot.cx} cy={vowelDot.cy} r="5"
          fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="1.5"
        />
      )}

      {/* Diphthong arrow */}
      {diphthongArrow && (
        <>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
            </marker>
          </defs>
          <circle cx={diphthongArrow.from.cx} cy={diphthongArrow.from.cy} r="4"
            fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1"
          />
          <line
            x1={diphthongArrow.from.cx} y1={diphthongArrow.from.cy}
            x2={diphthongArrow.to.cx} y2={diphthongArrow.to.cy}
            stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrowhead)"
          />
        </>
      )}

      {/* Inactive zone labels (faint) */}
      {!activeZone && Object.entries(ZONE_PATHS).map(([key, z]) => (
        <text key={key} x={z.lx} y={z.ly}
          fontSize="6" fill="#d1d5db" textAnchor="end"
        >
          {z.label}
        </text>
      ))}
    </svg>
  );
}
