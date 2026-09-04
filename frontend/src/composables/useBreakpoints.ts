// Falls back to Tailwind's default breakpoint values if CSS custom properties are not defined.
import { ref, onMounted, onUnmounted, computed, type Ref, type ComputedRef } from 'vue'

interface BreakpointValues {
    [key: string]: boolean
}

interface Breakpoints {
    [key: string]: string
}

interface UseBreakpointsReturn {
    screenSize: Ref<BreakpointValues>
    isSmUp: ComputedRef<boolean>
    isMdUp: ComputedRef<boolean>
    isLgUp: ComputedRef<boolean>
    isXlUp: ComputedRef<boolean>
    is2xlUp: ComputedRef<boolean>
    is3xlUp: ComputedRef<boolean>
    is4xlUp: ComputedRef<boolean>
    isMobile: ComputedRef<boolean>
    isTablet: ComputedRef<boolean>
    isDesktop: ComputedRef<boolean>
}

export function useBreakpoints(): UseBreakpointsReturn {
    const screenSize = ref<BreakpointValues>({})
    const mediaQueries: { [key: string]: MediaQueryList } = {}
    const handlers: { [key: string]: (e: MediaQueryListEvent) => void } = {}

    /**
     * Read breakpoint values from CSS custom properties defined in Tailwind config
     */
    const getBreakpointsFromCSS = (): Breakpoints => {
        if (typeof window === 'undefined') return {}

        const computedStyle = getComputedStyle(document.documentElement)

        // Standard Tailwind 4 breakpoint names
        const breakpointNames = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
        const breakpoints: Breakpoints = {}

        breakpointNames.forEach((name) => {
            // Read CSS custom property (e.g., --breakpoint-sm)
            const value = computedStyle.getPropertyValue(`--breakpoint-${name}`).trim()
            if (value) {
                breakpoints[name] = value
            }
        })

        // Fallback to default Tailwind values if CSS custom properties are not found
        return Object.keys(breakpoints).length > 0
            ? breakpoints
            : {
                  sm: '40rem',
                  md: '48rem',
                  lg: '64rem',
                  xl: '80rem',
                  '2xl': '96rem',
                  '3xl': '112rem',
                  '4xl': '128rem',
              }
    }

    /**
     * Update screen level state for a specific breakpoint
     */
    const updateScreenSize = (breakpoint: string, matches: boolean): void => {
        screenSize.value = {
            ...screenSize.value,
            [breakpoint]: matches,
        }
    }

    onMounted(() => {
        // Load breakpoints from Tailwind configuration
        const breakpoints = getBreakpointsFromCSS()

        // Initialize screen level
        Object.keys(breakpoints).forEach((breakpoint) => {
            screenSize.value[breakpoint] = false
        })

        // Create MediaQueryList for each breakpoint
        Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
            const mediaQuery = window.matchMedia(`(min-width: ${minWidth})`)
            mediaQueries[breakpoint] = mediaQuery

            // Create handler
            handlers[breakpoint] = (e: MediaQueryListEvent) => updateScreenSize(breakpoint, e.matches)

            // Set initial state
            updateScreenSize(breakpoint, mediaQuery.matches)

            // Add event listener
            mediaQuery.addEventListener('change', handlers[breakpoint])
        })
    })

    onUnmounted(() => {
        // Cleanup event listeners
        Object.entries(mediaQueries).forEach(([breakpoint, mediaQuery]) => {
            mediaQuery.removeEventListener('change', handlers[breakpoint])
        })
    })

    // Helper functions - computed for better reactivity
    const isSmUp = computed((): boolean => screenSize.value.sm || false)
    const isMdUp = computed((): boolean => screenSize.value.md || false)
    const isLgUp = computed((): boolean => screenSize.value.lg || false)
    const isXlUp = computed((): boolean => screenSize.value.xl || false)
    const is2xlUp = computed((): boolean => screenSize.value['2xl'] || false)
    const is3xlUp = computed((): boolean => screenSize.value['3xl'] || false)
    const is4xlUp = computed((): boolean => screenSize.value['4xl'] || false)

    // Device type helpers
    const isMobile = computed((): boolean => !isMdUp.value)
    const isTablet = computed((): boolean => isMdUp.value && !isLgUp.value)
    const isDesktop = computed((): boolean => isLgUp.value)

    return {
        screenSize,
        isSmUp,
        isMdUp,
        isLgUp,
        isXlUp,
        is2xlUp,
        is3xlUp,
        is4xlUp,
        isMobile,
        isTablet,
        isDesktop,
    }
}
