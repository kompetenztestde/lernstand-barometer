import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export type NavItemId =
    | 'info'
    | 'schedule'
    | 'filing'
    | 'correction'
    | 'results'
    | 'results-tests'
    | 'results-groups'
    | 'results-conference'
    | 'results-school-management'
    | 'results-self-evaluation'
    | 'task-browser'
    | 'download'

/** Primary route name for each segment index */
const segmentPrimaryRoute: Record<number, string> = {
    0: 'schedule',
    1: 'correction',
    2: 'result-tests',
    3: 'task-browser',
}

/** Maps NavItemId to Vue Router route name */
const navItemToRoute: Partial<Record<NavItemId, string>> = {
    info: 'info',
    schedule: 'schedule',
    filing: 'filing',
    correction: 'correction',
    'results-tests': 'result-tests',
    'results-groups': 'result-groups',
    'results-conference': 'result-conference',
    'results-school-management': 'result-school-management',
    'results-self-evaluation': 'self-evaluation',
    'task-browser': 'task-browser',
    download: 'download',
}

/** Which nav items each segment (by index) maps to */
const segmentToNav: Record<number, NavItemId[]> = {
    0: ['info', 'schedule', 'filing'],
    1: ['correction'],
    2: ['results'],
    3: ['results', 'task-browser', 'download'],
}

/** Which segments each nav item maps to */
const navToSegments: Record<NavItemId, number[]> = {
    info: [0],
    schedule: [0],
    filing: [0],
    correction: [1],
    results: [2, 3],
    'results-tests': [],
    'results-groups': [],
    'results-conference': [],
    'results-school-management': [],
    'results-self-evaluation': [],
    'task-browser': [3],
    download: [3],
}

// Module-level refs so state is shared across all component instances
const hoveredSegment = ref<number | null>(null)
const hoveredNavItem = ref<NavItemId | null>(null)

export function useCircleHighlight() {
    const highlightedSegments = computed<number[]>(() => {
        if (hoveredNavItem.value !== null) return navToSegments[hoveredNavItem.value]
        if (hoveredSegment.value !== null) return [hoveredSegment.value]
        return []
    })

    const highlightedNavItems = computed<NavItemId[]>(() => {
        if (hoveredSegment.value !== null) return segmentToNav[hoveredSegment.value]
        if (hoveredNavItem.value !== null) return [hoveredNavItem.value]
        return []
    })

    function hoverSegment(index: number) {
        hoveredSegment.value = index
    }

    function leaveSegment() {
        hoveredSegment.value = null
    }

    function hoverNavItem(id: NavItemId) {
        hoveredNavItem.value = id
    }

    function leaveNavItem() {
        hoveredNavItem.value = null
    }

    const router = useRouter()

    function navigateToSegment(index: number) {
        const route = segmentPrimaryRoute[index]
        if (route) router.push({ name: route })
    }

    function navigateToNavItem(id: NavItemId) {
        const route = navItemToRoute[id]
        if (route) router.push({ name: route })
    }

    return {
        highlightedSegments,
        highlightedNavItems,
        hoverSegment,
        leaveSegment,
        hoverNavItem,
        leaveNavItem,
        navigateToSegment,
        navigateToNavItem,
    }
}
