<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'
import IconLogout from '@/components/icons/IconLogout.vue'
import { useNavigationStore } from '@/stores/navigation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const title = computed(() => route.meta.title ?? '')
const navigation = useNavigationStore()

function logout() {
    auth.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="student-layout flex h-screen flex-col">
        <div aria-hidden="true" class="pointer-events-none fixed top-0 right-0 left-0 z-50 h-0.5 overflow-hidden">
            <div v-if="navigation.isNavigating" class="bg-primary absolute h-full w-2/5 animate-[navprogress_1.4s_ease-in-out_infinite]" />
        </div>
        <main class="flex flex-1 justify-center overflow-y-auto pt-10 lg:pt-10">
            <div class="w-full max-w-312 px-6 lg:px-10">
                <div v-if="title" class="mb-6 flex items-center justify-between gap-2 lg:mb-16 print:hidden">
                    <h2 class="text-primary font-bold tracking-wide uppercase lg:text-4xl">{{ title }}</h2>
                    <BaseButton variant="primary-outline" class="gap-1" size="sm" @click="logout">
                        <IconLogout class="size-5" />
                        <span>Abmelden</span>
                    </BaseButton>
                </div>
                <RouterView />
            </div>
        </main>
    </div>
</template>

<style scoped>
.student-layout {
    background:
        radial-gradient(ellipse 65% 55% at 98% 0%, rgba(0, 97, 115, 0.14) 0%, transparent 100%),
        radial-gradient(ellipse 55% 50% at 0% 100%, rgba(96, 0, 81, 0.1) 0%, transparent 100%),
        radial-gradient(ellipse 45% 40% at 55% 45%, rgba(81, 96, 0, 0.05) 0%, transparent 100%), #f8fbfc;
}

@media print {
    .student-layout {
        background: none;
    }
}
</style>
