export default function RelatoLogo({ size = 24, className = '' }) {
  return (
    <img
      src="/images/relato_icon.png"
      alt=""
      width={size}
      height={size}
      className={`rounded ${className}`}
      aria-hidden="true"
    />
  );
}
