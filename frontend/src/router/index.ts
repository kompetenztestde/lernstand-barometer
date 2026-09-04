import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/layouts/LoginLayout.vue'),
        },
        {
            path: '/',
            component: () => import('@/layouts/TeacherLayout.vue'),
            meta: { requiresAuth: true, role: 'teacher' },
            children: [
                {
                    path: '',
                    redirect: 'info',
                },
                {
                    path: 'info',
                    name: 'info',
                    component: () => import('@/pages/InfoPage.vue'),
                    meta: { title: 'Allgemeine Informationen' },
                },
                {
                    path: 'schedule',
                    name: 'schedule',
                    component: () => import('@/pages/SchedulePage.vue'),
                    meta: { title: 'Termine' },
                },
                {
                    path: 'filing',
                    name: 'filing',
                    component: () => import('@/pages/FilingPage.vue'),
                    meta: { title: 'Anmeldung zu den Kompetenztests' },
                },
                {
                    path: 'correction',
                    name: 'correction',
                    component: () => import('@/pages/CorrectionPage.vue'),
                    meta: { title: 'Korrektur der Kompetenztests' },
                },
                {
                    path: 'results/tests',
                    name: 'result-tests',
                    component: () => import('@/pages/ResultTestsPage.vue'),
                    meta: { title: 'Fachbericht' },
                },
                {
                    path: 'results/groups',
                    name: 'result-groups',
                    component: () => import('@/pages/ResultGroupsPage.vue'),
                    meta: { title: 'Klassenbericht' },
                },
                {
                    path: 'results/conference',
                    name: 'result-conference',
                    component: () => import('@/pages/ConferencePage.vue'),
                    meta: { title: 'Fachkonferenz', hideTitle: true },
                },
                {
                    path: 'results/school-management',
                    name: 'result-school-management',
                    component: () => import('@/pages/SchoolManagementPage.vue'),
                    meta: { title: 'Schulleitung' },
                },
                {
                    path: 'results/self-evaluation',
                    name: 'self-evaluation',
                    component: () => import('@/pages/SelfEvaluationPage.vue'),
                    meta: { title: 'Selbsteinschätzung', hideTitleOnPrint: true },
                },
                {
                    path: 'task-browser',
                    name: 'task-browser',
                    component: () => import('@/pages/TaskBrowserPage.vue'),
                    meta: { title: 'Fördermaterialien' },
                },
                {
                    path: 'download',
                    name: 'download',
                    component: () => import('@/pages/DownloadPage.vue'),
                    meta: { title: 'Berichte Downloaden', requiresPdf: true },
                },
                {
                    path: 'settings',
                    name: 'settings',
                    component: () => import('@/pages/SettingsPage.vue'),
                    meta: { title: 'Einstellungen' },
                },
                {
                    path: 'contact',
                    name: 'contact',
                    component: () => import('@/pages/ContactPage.vue'),
                    meta: { title: 'Hotline und Kontakte' },
                },
                {
                    path: 'archive',
                    name: 'archive',
                    component: () => import('@/pages/ArchivePage.vue'),
                    meta: { title: 'Archiv' },
                },
            ],
        },
        {
            path: '/student',
            component: () => import('@/layouts/StudentLayout.vue'),
            meta: { requiresAuth: true, role: 'student' },
            children: [
                {
                    path: '',
                    redirect: 'self-evaluation',
                },
                {
                    path: 'self-evaluation',
                    name: 'student-home',
                    component: () => import('@/pages/StudentSelfEvaluationPage.vue'),
                    meta: { title: 'Deine Ergebnisse' },
                },
            ],
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: () => import('@/pages/NotFoundPage.vue'),
        },
    ],
})

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'

router.beforeEach((to) => {
    if (to.meta.requiresPdf && !pdfEnabled) {
        return { name: 'info' }
    }
    const auth = useAuthStore()

    // session token has passed its expiry timestamp
    if (auth.isAuthenticated && auth.isSessionExpired) {
        auth.logout()
        return { name: 'login' }
    }

    // Stale session: has token but no role (e.g. from before role support was added)
    if (auth.isAuthenticated && !auth.role) {
        auth.logout()
        return { name: 'login' }
    }

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.name === 'login' && auth.isAuthenticated) {
        return auth.role === 'student' || auth.role === 'demo-student' ? { name: 'student-home' } : { name: 'info' }
    }

    // demo roles have the same route access as their real counterparts
    const effectiveRole = auth.role === 'demo' ? 'teacher' : auth.role === 'demo-student' ? 'student' : auth.role
    if (to.meta.requiresAuth && to.meta.role && to.meta.role !== effectiveRole) {
        return effectiveRole === 'student' ? { name: 'student-home' } : { name: 'info' }
    }

    useNavigationStore().startNavigation()
})

router.afterEach(() => {
    useNavigationStore().finishNavigation()
})

export default router
