<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SideMenu from '@/components/SideMenu.vue'
import StudentNameImport from '@/components/StudentNameImport.vue'
import TeacherWelcomeModal from '@/components/TeacherWelcomeModal.vue'
import { useViewSelectionStore } from '@/stores/viewSelection'
import { useParticipatedGroupsQuery } from '@/queries/useParticipatedGroupsQuery'
import { useNavigationStore } from '@/stores/navigation'
import PageLoader from '@/components/base/PageLoader.vue'
import TeacherInfoButton from '@/components/TeacherInfoButton.vue'
import { useTeacherWelcomeModal } from '@/composables/useTeacherWelcomeModal'

const route = useRoute()
const title = computed(() => route.meta.title ?? 'Standardtitel')

const viewSelection = useViewSelectionStore()
const { data: participatedGroups } = useParticipatedGroupsQuery()
const selectedGroupName = computed(
    () => participatedGroups.value?.find((g) => g.groupId === viewSelection.selectedGroupId)?.groupName ?? '',
)

const navigation = useNavigationStore()

const { showIfFirstTime } = useTeacherWelcomeModal()
onMounted(showIfFirstTime)
</script>

<template>
    <div class="light bg-surface-1 flex h-screen flex-col lg:flex-row print:h-auto">
        <SideMenu class="print:hidden" />
        <main class="flex flex-1 justify-center overflow-y-auto [scrollbar-gutter:stable] print:overflow-visible">
            <div class="w-full max-w-312 px-10 pt-10 pb-20 print:pb-0">
                <PageLoader />
                <div v-show="!navigation.isLoading">
                    <div
                        v-if="!route.meta.hideTitle"
                        class="mb-10 flex items-center justify-between gap-2"
                        :class="{ 'print:hidden': route.meta.hideTitleOnPrint }"
                    >
                        <div>
                            <h2 class="text-primary text-3xl font-bold tracking-wide uppercase xl:text-4xl">{{ title }}</h2>
                            <p v-if="selectedGroupName" class="mt-1 hidden text-lg text-gray-600 print:block">
                                Klasse: {{ selectedGroupName }}
                            </p>
                        </div>
                        <TeacherInfoButton class="print:hidden" />
                    </div>
                    <RouterView />
                    <div class="pb-16 print:hidden"></div>
                </div>
            </div>
        </main>
    </div>

    <StudentNameImport />
    <TeacherWelcomeModal />
</template>
