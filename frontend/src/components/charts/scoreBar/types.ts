export type ScoreBarData = {
    title?: string | null
    titleTooltip?: string
    titleTooltipUnderlineOffset?: string
    titleTooltipUnderlineThickness?: string
    /** CSS color value, e.g. '#005160' or 'var(--color-primary)' */
    color?: string
    /** Numeric value used to calculate differences between bars */
    barValue: number
    barValuePrefix?: string
    barValueSuffix?: string
    /** Overrides the default displayed value when set */
    barDisplayedValue?: string | null
    /** Integer 0–100, controls the rendered bar width */
    barLength: number
    /** CSS size value, e.g. '1.4rem' or '24px' */
    barThickness?: string
    showValue?: boolean
    /** Blurs the bar and shows "bald verfügbar" when true */
    comingSoon?: boolean
}
