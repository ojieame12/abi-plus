/**
 * Standardized Icon Sizes
 * 
 * Only 3 sizes for maximum consistency.
 * Use with Lucide icons: <Icon size={ICON.size.md} strokeWidth={ICON.stroke} />
 */

export const ICON = {
    /** Standard stroke width for all icons */
    stroke: 1.5,

    /** Icon sizes */
    size: {
        /** 14px - Small: inline text, metadata, badges */
        sm: 14,
        /** 18px - Medium: buttons, chips, cards (DEFAULT) */
        md: 18,
        /** 24px - Large: sidebar nav, hero sections, panel headers */
        lg: 24,
    },
} as const;
