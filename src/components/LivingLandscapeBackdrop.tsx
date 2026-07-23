import kiteValley from "../assets/zhiye-kite-valley.png"

export default function LivingLandscapeBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="living-landscape pointer-events-none absolute inset-0 z-0 overflow-hidden"
      data-testid="living-landscape"
    >
      <img
        alt=""
        className="living-landscape-scene absolute inset-0 h-full w-full object-cover"
        data-testid="living-landscape-scene"
        src={kiteValley}
      />
      <div className="living-landscape-clouds absolute inset-0" data-testid="living-landscape-clouds" />
      <div className="living-landscape-sun absolute inset-0" />
      <div className="living-landscape-river absolute inset-x-[18%] bottom-0 h-[47%]" />
      <div className="living-landscape-kites absolute inset-0" data-testid="living-landscape-kites">
        <svg className="living-landscape-kite living-landscape-kite-one" viewBox="0 0 42 55" fill="none">
          <path d="M21 2 39 22 21 42 3 22 21 2Z" fill="#F6B84A" fillOpacity=".88" />
          <path d="M21 2v40M3 22h36" stroke="#D86B67" strokeWidth="1.3" />
          <path d="M21 42c-3 5 5 5 1 10s6 5 2 10" stroke="#D86B67" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <svg className="living-landscape-kite living-landscape-kite-two" viewBox="0 0 42 55" fill="none">
          <path d="M21 2 39 22 21 42 3 22 21 2Z" fill="#78C8A6" fillOpacity=".82" />
          <path d="M21 2v40M3 22h36" stroke="#4A9B8E" strokeWidth="1.3" />
          <path d="M21 42c3 5-5 5-1 10s-6 5-2 10" stroke="#4A9B8E" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.86)_0%,rgba(255,255,255,.44)_34%,rgba(255,255,255,.06)_60%,rgba(255,255,255,.42)_100%)]" />
      <div className="welcome-grain absolute inset-0 opacity-[.14]" />
    </div>
  )
}
