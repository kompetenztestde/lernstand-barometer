<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSchoolInformationQuery } from '@/queries/useSchoolInformationQuery'
import { useRouter, useRoute } from 'vue-router'
import { useCircleHighlight } from '@/composables/useCircleHighlight'

// useBreakpoints is used here because v-show/v-if cannot react to Tailwind breakpoints directly
import { useBreakpoints } from '@/composables/useBreakpoints'

import BaseButton from './base/BaseButton.vue'
import MainNavLink from '@/components/MainNavLink.vue'
import BurgerButton from '@/components/BurgerButton.vue'
import IconBarometer from './icons/IconBarometer.vue'
import IconPanelSidebar from '@/components/icons/IconPanelSidebar.vue'
import IconLogout from '@/components/icons/IconLogout.vue'
import IconGrid from '@/components/icons/IconGrid.vue'
import IconCalendar from '@/components/icons/IconCalendar.vue'
import IconRocket from '@/components/icons/IconRocket.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconTrendUp from '@/components/icons/IconTrendUp.vue'
import IconDownload from '@/components/icons/IconDownload.vue'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconMail from '@/components/icons/IconMail.vue'
import IconArchive from '@/components/icons/IconArchive.vue'
import IconBook from './icons/IconBook.vue'

const auth = useAuthStore()
const { data: schoolInfo } = useSchoolInformationQuery()
const router = useRouter()
const route = useRoute()

const isSubmenuActive = computed(() => route.path.startsWith('/results/'))

const isMobileMenuOpen = ref(false)
const isDesktopMenuOpen = ref(true)
const { isLgUp } = useBreakpoints()

const isDesktopHover = ref(false)
const isDesktopOpenEffective = computed(() => isDesktopMenuOpen.value || (isLgUp.value && isDesktopHover.value))

const showSubmenu = ref(true)

const isCollapsed = computed(() => !isDesktopOpenEffective.value)
provide('navCollapsed', isCollapsed)

function logout() {
    auth.logout()
    router.push({ name: 'login' })
}

function toggleSubmenu() {
    showSubmenu.value = !showSubmenu.value
}

function toggleDesktopMenu() {
    isDesktopMenuOpen.value = !isDesktopMenuOpen.value
    isDesktopHover.value = false
}

const appVersion = __APP_VERSION__

const { highlightedNavItems, hoverNavItem, leaveNavItem } = useCircleHighlight()

const isOnInfoPage = computed(() => route.path === '/info')

// Highlights are only active on the info page (where the FeedbackCircle lives)
const activeHighlights = computed(() => (isOnInfoPage.value ? highlightedNavItems.value : []))

// True when ALL items of a group are highlighted at once (= a circle segment is hovered)
const isGroupAHighlighted = computed(() => (['info', 'schedule', 'filing'] as const).every((id) => activeHighlights.value.includes(id)))
const isGroupBHighlighted = computed(() =>
    (['results', 'task-browser', 'download'] as const).every((id) => activeHighlights.value.includes(id)),
)

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'
</script>

<template>
    <aside
        aria-label="Seitennavigation"
        class="flex flex-col overflow-hidden border-b border-gray-300 bg-white px-4 py-4 transition-all duration-300 lg:row-span-2 lg:w-[16rem] lg:shadow-lg lg:shadow-gray-400 xl:w-[20rem]"
        :class="{ 'lg:w-15!': !isDesktopOpenEffective }"
        @mouseenter="isDesktopHover = true"
        @mouseleave="isDesktopHover = false"
    >
        <header
            class="flex items-center space-x-3 border-0 lg:border-b lg:border-gray-300 lg:pb-2 xl:pb-4"
            :class="{
                'justify-between border-0! lg:flex-col': !isDesktopOpenEffective,
                'flex-row border-0!': isMobileMenuOpen,
            }"
        >
            <IconBarometer class="text-primary m-0 size-14 shrink-0 rounded xl:size-16" :class="{ 'size-10!': !isDesktopOpenEffective }" />

            <div v-show="isDesktopOpenEffective" class="ml-3 flex grow items-center gap-3">
                <h1 class="flex flex-col text-xl leading-none font-semibold xl:text-2xl">
                    <span class="text-primary">Lernstand</span>
                    <span class="text-gray-400">Barometer</span>
                </h1>
            </div>
            <BurgerButton class="lg:hidden" :isOpen="isMobileMenuOpen" @click="isMobileMenuOpen = !isMobileMenuOpen" />
            <button
                type="button"
                class="hidden cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 lg:block"
                @click="toggleDesktopMenu"
                :aria-label="isDesktopMenuOpen ? 'Menü schließen' : 'Menü öffnen'"
                :aria-expanded="isDesktopMenuOpen"
            >
                <IconPanelSidebar
                    :class="{
                        'text-primary': isDesktopMenuOpen,
                        'text-gray-400': !isDesktopMenuOpen,
                    }"
                />
            </button>
        </header>
        <nav
            aria-label="Hauptmenü"
            v-show="isLgUp || isMobileMenuOpen"
            class="!lg:block mt-4 flex grow flex-col overflow-y-auto rounded border border-gray-300 p-4 text-sm lg:border-0 lg:p-0 xl:text-base"
        >
            <!-- Group A: Segment 0 — info, schedule, filing -->
            <div
                class="flex flex-col rounded-md outline-2 outline-transparent transition-all duration-200"
                :class="isGroupAHighlighted ? 'outline-primary/50 bg-primary/10' : ''"
            >
                <MainNavLink
                    @click="isMobileMenuOpen = false"
                    url="/info"
                    label="Allgemeine Infos"
                    :highlighted="activeHighlights.includes('info') && !isGroupAHighlighted"
                    @mouseenter="hoverNavItem('info')"
                    @mouseleave="leaveNavItem()"
                >
                    <IconGrid />
                </MainNavLink>
                <MainNavLink
                    @click="isMobileMenuOpen = false"
                    url="/schedule"
                    label="Termine"
                    :highlighted="activeHighlights.includes('schedule') && !isGroupAHighlighted"
                    @mouseenter="hoverNavItem('schedule')"
                    @mouseleave="leaveNavItem()"
                >
                    <IconCalendar />
                </MainNavLink>
                <MainNavLink
                    @click="isMobileMenuOpen = false"
                    url="/filing"
                    label="Anmeldung"
                    :highlighted="activeHighlights.includes('filing') && !isGroupAHighlighted"
                    @mouseenter="hoverNavItem('filing')"
                    @mouseleave="leaveNavItem()"
                >
                    <IconRocket />
                </MainNavLink>
            </div>
            <MainNavLink
                @click="isMobileMenuOpen = false"
                url="/correction"
                label="Korrektur"
                :highlighted="activeHighlights.includes('correction')"
                @mouseenter="hoverNavItem('correction')"
                @mouseleave="leaveNavItem()"
            >
                <IconCheck />
            </MainNavLink>
            <!-- Group B: Segment 3 — results + download -->
            <div
                class="flex flex-col rounded-md outline-2 outline-transparent transition-all duration-200"
                :class="isGroupBHighlighted ? 'outline-primary/50 bg-primary/10' : ''"
            >
                <div
                    class="rounded-md outline-2 outline-transparent transition-all duration-200"
                    :class="activeHighlights.includes('results') && !isGroupBHighlighted ? 'outline-primary/50 bg-primary/10' : ''"
                    @mouseenter="hoverNavItem('results')"
                    @mouseleave="leaveNavItem()"
                >
                    <!-- Menu with Submenu -->
                    <button
                        type="button"
                        class="w-full"
                        @click="toggleSubmenu"
                        :aria-expanded="showSubmenu"
                        aria-controls="submenu-rueckmeldungen"
                    >
                        <MainNavLink
                            label="Alle Rückmeldungen"
                            :has-children="true"
                            :is-open="showSubmenu"
                            :active="isSubmenuActive && isCollapsed"
                            :highlighted="false"
                        >
                            <IconTrendUp />
                        </MainNavLink>
                    </button>

                    <!-- Submenu -->
                    <ul
                        v-if="showSubmenu && isDesktopOpenEffective"
                        id="submenu-rueckmeldungen"
                        class="my-1 ml-5 border-l border-gray-300 xl:ml-6"
                    >
                        <li>
                            <MainNavLink
                                @click="isMobileMenuOpen = false"
                                class="ml-5 py-0.5!"
                                url="/results/tests"
                                label="Fachlehrkraft"
                                :highlighted="activeHighlights.includes('results-tests')"
                                @mouseenter="hoverNavItem('results-tests')"
                                @mouseleave="leaveNavItem()"
                            />
                        </li>
                        <li>
                            <MainNavLink
                                @click="isMobileMenuOpen = false"
                                class="ml-5 py-0.5!"
                                url="/results/groups"
                                label="Klassenlehrkraft"
                                :highlighted="activeHighlights.includes('results-groups')"
                                @mouseenter="hoverNavItem('results-groups')"
                                @mouseleave="leaveNavItem()"
                            />
                        </li>
                        <li>
                            <MainNavLink
                                @click="isMobileMenuOpen = false"
                                class="ml-5 py-0.5!"
                                url="/results/conference"
                                label="Fachkonferenz"
                                :highlighted="activeHighlights.includes('results-conference')"
                                @mouseenter="hoverNavItem('results-conference')"
                                @mouseleave="leaveNavItem()"
                            />
                        </li>
                        <li>
                            <MainNavLink
                                @click="isMobileMenuOpen = false"
                                class="ml-5 py-0.5!"
                                url="/results/school-management"
                                label="Schulleitung"
                                :highlighted="activeHighlights.includes('results-school-management')"
                                @mouseenter="hoverNavItem('results-school-management')"
                                @mouseleave="leaveNavItem()"
                            />
                        </li>
                        <li>
                            <MainNavLink
                                @click="isMobileMenuOpen = false"
                                class="ml-5 py-0.5!"
                                url="/results/self-evaluation"
                                label="Selbsteinschätzung"
                                :highlighted="activeHighlights.includes('results-self-evaluation')"
                                @mouseenter="hoverNavItem('results-self-evaluation')"
                                @mouseleave="leaveNavItem()"
                            />
                        </li>
                    </ul>
                </div>
                <MainNavLink
                    @click="isMobileMenuOpen = false"
                    url="/task-browser"
                    label="Fördermaterialien"
                    :highlighted="activeHighlights.includes('task-browser') && !isGroupBHighlighted"
                    @mouseenter="hoverNavItem('task-browser')"
                    @mouseleave="leaveNavItem()"
                >
                    <IconBook />
                </MainNavLink>
                <MainNavLink
                    v-if="pdfEnabled"
                    @click="isMobileMenuOpen = false"
                    url="/download"
                    label="Berichte downloaden"
                    :highlighted="activeHighlights.includes('download') && !isGroupBHighlighted"
                    @mouseenter="hoverNavItem('download')"
                    @mouseleave="leaveNavItem()"
                >
                    <IconDownload />
                </MainNavLink>
            </div>
            <MainNavLink @click="isMobileMenuOpen = false" url="/settings" label="Einstellungen">
                <IconSettings />
            </MainNavLink>
            <MainNavLink @click="isMobileMenuOpen = false" url="/contact" label="Hotline und Kontakte">
                <IconMail />
            </MainNavLink>
            <MainNavLink @click="isMobileMenuOpen = false" url="/archive" label="Archiv">
                <IconArchive />
            </MainNavLink>
            <p v-if="isDesktopOpenEffective && schoolInfo?.schoolName" class="my-2 text-center text-xs text-gray-500">
                Angemeldet als <strong>Lehrer:in</strong> an<br />
                <strong>{{ schoolInfo.schoolName }}</strong>
            </p>
            <BaseButton @click="logout" class="w-full gap-1" :class="{ 'px-2!': isCollapsed }" variant="primary-outline">
                <IconLogout class="size-5 shrink-0" />
                <span v-show="!isCollapsed">Abmelden</span>
            </BaseButton>
            <div class="mt-auto self-end text-sm text-gray-400">Version {{ appVersion }}</div>
        </nav>
    </aside>
</template>
