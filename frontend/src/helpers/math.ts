export function roundNumber(value: number, decimalPlaces = 2) {
    const multiplier = Math.pow(10, decimalPlaces)
    return Math.round(value * multiplier) / multiplier
}
