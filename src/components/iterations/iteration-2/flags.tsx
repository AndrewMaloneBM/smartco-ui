import type { Market } from "@/lib/types";

/**
 * Real flag artwork (exported from the 🖼️ Flags Figma library), inlined as SVG
 * markup — not emoji, and not a public/ asset (avoids GitHub Pages basePath
 * issues, since next.config.mjs is Adri's file and off-limits to edit). Adri's
 * `MARKET_FLAGS` in src/lib/types.ts is emoji-based; this replaces it for the
 * Market pill only.
 */
const FLAG_SVG: Record<Market, string> = {
  FR: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V26.667H40V0Z" fill="#F0F0F0"/><path d="M13.333 0H0V26.667H13.333V0Z" fill="#0052B4"/><path d="M40 0H26.667V26.667H40V0Z" fill="#D80027"/></g><defs><clipPath id="c"><rect width="40.0001" height="26.67" fill="white"/></clipPath></defs></svg>`,
  DE: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V8.89H40V0Z" fill="black"/><path d="M40 8.89H0V17.78H40V8.89Z" fill="#D80027"/><path d="M40 17.78H0V26.67H40V17.78Z" fill="#FFDA44"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  GB: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0.000305176H0V26.6673H40V0.000305176Z" fill="#F0F0F0"/><path d="M22.5 0H17.5V10.8333H0V15.8333H17.5V26.6666H22.5V15.8333H40V10.8333H22.5V0Z" fill="#D80027"/><g><path d="M30.7646 17.9706L40.0002 23.1016V17.9706H30.7646Z" fill="#0052B4"/><path d="M24.3479 17.9706L40.0001 26.6663V24.2074L28.7741 17.9706H24.3479Z" fill="#0052B4"/><path d="M35.8309 26.6666L24.3479 20.2866V26.6666H35.8309Z" fill="#0052B4"/></g><path d="M24.3479 17.9706L40.0001 26.6663V24.2074L28.7741 17.9706H24.3479Z" fill="#F0F0F0"/><path d="M24.3479 17.9706L40.0001 26.6663V24.2074L28.7741 17.9706H24.3479Z" fill="#D80027"/><g><path d="M7.05789 17.9704L0 21.8915V17.9704H7.05789Z" fill="#0052B4"/><path d="M15.6522 19.076V26.6659H1.99146L15.6522 19.076Z" fill="#0052B4"/></g><path d="M11.226 17.9706L0 24.2074V26.6663L15.6522 17.9706H11.226Z" fill="#D80027"/><g><path d="M9.23555 8.69568L0 3.56474V8.69568H9.23555Z" fill="#0052B4"/><path d="M15.6522 8.69563L0 0V2.45891L11.226 8.69563H15.6522Z" fill="#0052B4"/><path d="M4.16919 0L15.6522 6.38V0H4.16919Z" fill="#0052B4"/></g><path d="M15.6522 8.69563L0 0V2.45891L11.226 8.69563H15.6522Z" fill="#F0F0F0"/><path d="M15.6522 8.69563L0 0V2.45891L11.226 8.69563H15.6522Z" fill="#D80027"/><g><path d="M32.9424 8.69557L40.0003 4.77448V8.69557H32.9424Z" fill="#0052B4"/><path d="M24.3479 7.59001V9.15527e-05H38.0086L24.3479 7.59001Z" fill="#0052B4"/></g><path d="M28.7741 8.69563L40.0001 2.45891V0L24.3479 8.69563H28.7741Z" fill="#D80027"/></g><defs><clipPath id="c"><rect width="40.0003" height="26.67" fill="white"/></clipPath></defs></svg>`,
  US: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V26.667H40V0Z" fill="#F0F0F0"/><path d="M40 24.5V26.5996H0V24.5H40ZM40 22.3496H0V20.25H40V22.3496ZM40 18.3496H0V16.25H40V18.3496ZM40 14.3496H0V12.25H40V14.3496ZM40 10.0996H0V8H40V10.0996ZM40 6.09961H0V4H40V6.09961ZM40 2.09961H0V0H40V2.09961Z" fill="#D80027"/><path d="M20 0H0V14.3591H20V0Z" fill="#2E52B2"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  ES: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V26.667H40V0Z" fill="#FFDA44"/><g><path d="M40 0H0V8.88868H40V0Z" fill="#D80027"/><path d="M40 17.7774H0V26.6661H40V17.7774Z" fill="#D80027"/></g></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  IT: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M26.6667 0H13.3333H0V26.6665H13.3333H26.6667H40V0H26.6667Z" fill="#F0F0F0"/><path d="M13.333 0H0V26.667H13.333V0Z" fill="#6DA544"/><path d="M40 0H26.667V26.667H40V0Z" fill="#D80027"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  NL: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V8.89H40V0Z" fill="#A2001D"/><path d="M40 8.89H0V17.78H40V8.89Z" fill="#F0F0F0"/><path d="M40 17.78H0V26.67H40V17.78Z" fill="#0052B4"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  BE: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V26.6691H40V0Z" fill="#FFDA44"/><path d="M13.333 0H0V26.67H13.333V0Z" fill="black"/><path d="M39.9999 0H26.6669V26.67H39.9999V0Z" fill="#D80027"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  PT: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path d="M40 0H0V26.6661H40V0Z" fill="#D80027"/><path d="M15.3626 0V13.7678V26.6661H0V0H15.3626Z" fill="#6DA544"/><g><path d="M15.3625 18.335C18.124 18.335 20.3625 16.0964 20.3625 13.335C20.3625 10.5736 18.124 8.33499 15.3625 8.33499C12.6011 8.33499 10.3625 10.5736 10.3625 13.335C10.3625 16.0964 12.6011 18.335 15.3625 18.335Z" fill="#FFDA44"/><path d="M12.5498 10.835V13.9601C12.5498 15.5134 13.809 16.7726 15.3623 16.7726C16.9156 16.7726 18.1748 15.5134 18.1748 13.9601V10.835H12.5498Z" fill="#D80027"/><path d="M15.3624 14.8975C14.8455 14.8975 14.4249 14.4769 14.4249 13.96V12.71H16.3V13.96C16.2999 14.4769 15.8793 14.8975 15.3624 14.8975Z" fill="#F0F0F0"/></g></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
  JP: `<svg viewBox="0 0 40 27" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="27" fill="#F5F5F5"/><g clip-path="url(#c)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0.860321H40V27.5303H0V0.860321Z" fill="#F0F0F0"/><path d="M20 21.835C24.6944 21.835 28.5 18.0294 28.5 13.335C28.5 8.64058 24.6944 4.835 20 4.835C15.3056 4.835 11.5 8.64058 11.5 13.335C11.5 18.0294 15.3056 21.835 20 21.835Z" fill="#D80027"/></g><defs><clipPath id="c"><rect width="40" height="26.67" fill="white"/></clipPath></defs></svg>`,
};

/**
 * Flags with a significant white/grey area need a hairline border so that area
 * doesn't blend into the pill's own light grey background. Flags that are fully
 * saturated colour throughout (DE, ES, BE, PT) don't need it.
 */
const FLAG_NEEDS_BORDER: Record<Market, boolean> = {
  FR: true,
  DE: false,
  GB: true,
  US: true,
  ES: false,
  IT: true,
  NL: true,
  BE: false,
  PT: false,
  JP: true,
};

/** Small rounded flag chip (🚀 Components "Pill", flag prefix — 12×8). */
export function MarketFlag({ market }: { market: Market }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 12,
        height: 8,
        borderRadius: 0.67,
        overflow: "hidden",
        border: FLAG_NEEDS_BORDER[market] ? "1px solid var(--rev-flag-border)" : undefined,
        flexShrink: 0,
      }}
    >
      <span
        style={{ display: "block", width: "100%", height: "100%" }}
        // eslint-disable-next-line react/no-danger -- trusted static flag artwork, not user input
        dangerouslySetInnerHTML={{ __html: FLAG_SVG[market].replace("<svg ", '<svg width="100%" height="100%" ') }}
      />
    </span>
  );
}
