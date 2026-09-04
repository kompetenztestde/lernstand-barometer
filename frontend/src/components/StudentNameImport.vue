<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useStudentNamesStore } from '@/stores/studentNames'
import { useNameImportTrigger } from '@/composables/useNameImportTrigger'

interface CodeEntry {
    ident: string
    name: string
}

interface ImportFile {
    codes: CodeEntry[]
    groupId?: number
    campaignBase?: string
    campaignId?: number
}

const store = useStudentNamesStore()

const isDragOver = ref(false)
const step = ref<'confirm' | 'overwrite' | null>(null)
const pendingNames = ref<Record<string, string>>({})
const pendingGroupId = ref<number | undefined>(undefined)
const pendingMeta = ref<{ campaignBase: string; campaignId: number } | undefined>(undefined)
const conflictingCodes = ref<{ ident: string; oldName: string; newName: string }[]>([])
const parseError = ref<string | null>(null)

function parseFile(
    file: File,
): Promise<{ names: Record<string, string>; groupId?: number; meta?: { campaignBase: string; campaignId: number } }> {
    return new Promise((resolve, reject) => {
        if (!file.name.endsWith('.json')) {
            reject('Bitte eine JSON-Datei hochladen.')
            return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const parsed: ImportFile = JSON.parse(e.target?.result as string)
                if (!Array.isArray(parsed.codes)) {
                    reject('Ungültiges Dateiformat: Kein "codes"-Array gefunden.')
                    return
                }
                const names: Record<string, string> = {}
                for (const entry of parsed.codes) {
                    if (entry.ident && entry.name) {
                        names[entry.ident] = entry.name
                    }
                }
                if (Object.keys(names).length === 0) {
                    reject('Keine Klarnamen in der Datei gefunden.')
                    return
                }
                const meta =
                    parsed.campaignBase && parsed.campaignId
                        ? { campaignBase: parsed.campaignBase, campaignId: parsed.campaignId }
                        : undefined
                resolve({ names, groupId: parsed.groupId, meta })
            } catch {
                reject('Die Datei konnte nicht gelesen werden.')
            }
        }
        reader.readAsText(file)
    })
}

async function handleFile(file: File) {
    parseError.value = null
    try {
        const { names, groupId, meta } = await parseFile(file)
        pendingNames.value = names
        pendingGroupId.value = groupId
        pendingMeta.value = meta

        conflictingCodes.value = Object.entries(names)
            .filter(([ident, newName]) => store.getName(ident) && store.getName(ident) !== newName)
            .map(([ident, newName]) => ({ ident, oldName: store.getName(ident)!, newName }))

        step.value = 'confirm'
    } catch (err) {
        parseError.value = err as string
        step.value = 'confirm'
    }
}

function onDragOver(e: DragEvent) {
    if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault()
        isDragOver.value = true
    }
}

function onDragLeave(e: DragEvent) {
    if ((e as any).relatedTarget === null) {
        isDragOver.value = false
    }
}

function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = false
    const file = e.dataTransfer?.files[0]
    if (file) handleFile(file)
}

onMounted(() => {
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('drop', onDrop)
})

onUnmounted(() => {
    document.removeEventListener('dragover', onDragOver)
    document.removeEventListener('dragleave', onDragLeave)
    document.removeEventListener('drop', onDrop)
})

function confirmImport() {
    if (conflictingCodes.value.length > 0) {
        step.value = 'overwrite'
    } else {
        applyImport()
    }
}

function applyImport() {
    store.setNames(pendingNames.value, pendingGroupId.value, pendingMeta.value)
    reset()
}

function reset() {
    step.value = null
    pendingNames.value = {}
    pendingGroupId.value = undefined
    pendingMeta.value = undefined
    conflictingCodes.value = []
    parseError.value = null
}

const isOpen = computed(() => step.value !== null)

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function onFileInputChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) handleFile(file)
    ;(e.target as HTMLInputElement).value = ''
}

const { triggerSignal } = useNameImportTrigger()
watch(triggerSignal, () => fileInput.value?.click())
</script>

<template>
    <input ref="fileInput" type="file" accept=".json" class="hidden" aria-label="Klarnamen-Datei auswählen" @change="onFileInputChange" />

    <!-- Drag-over overlay -->
    <Transition name="fade">
        <div
            v-if="isDragOver"
            class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 ring-4 ring-blue-400 ring-inset"
        >
            <div class="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
                <p class="text-lg font-semibold text-blue-700">Klarnamen-Datei hier ablegen</p>
            </div>
        </div>
    </Transition>

    <!-- Step 1: Confirmation -->
    <BaseModal :isOpen="isOpen && step === 'confirm'" @close="reset">
        <template #header>
            <p class="text-base font-semibold text-gray-800">Klarnamen importieren</p>
        </template>

        <div v-if="parseError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ parseError }}
        </div>
        <div v-else class="space-y-4 text-sm text-gray-700">
            <p>
                Sie importieren jetzt Klarnamen von Schüler:innen. Die Klarnamen sind
                <strong>nur lokal in Ihrem Browser gespeichert</strong> und werden nicht hochgeladen. Die Klarnamen sind für alle sichtbar,
                die sich in diesem Browser auf dieser Seite anmelden.
            </p>
            <p class="text-gray-500">{{ Object.keys(pendingNames).length }} Einträge gefunden.</p>
        </div>

        <template #footer>
            <BaseButton variant="default-outline" @click="reset">Abbrechen</BaseButton>
            <BaseButton v-if="!parseError" variant="primary" class="ml-2" @click="confirmImport">OK</BaseButton>
        </template>
    </BaseModal>

    <!-- Step 2: Overwrite confirmation -->
    <BaseModal :isOpen="isOpen && step === 'overwrite'" @close="reset">
        <template #header>
            <p class="text-base font-semibold text-gray-800">Namen überschreiben?</p>
        </template>

        <div class="space-y-3 text-sm text-gray-700">
            <p>Folgende Codes wurden bereits Namen zugeordnet. Überschreiben?</p>
            <ul class="max-h-60 overflow-auto rounded-lg border border-gray-200 bg-gray-50">
                <li
                    v-for="c in conflictingCodes"
                    :key="c.ident"
                    class="flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0"
                >
                    <span class="w-12 font-mono text-gray-500">{{ c.ident }}</span>
                    <span class="text-gray-400 line-through">{{ c.oldName }}</span>
                    <span class="text-gray-300">→</span>
                    <span class="font-medium text-gray-800">{{ c.newName }}</span>
                </li>
            </ul>
        </div>

        <template #footer>
            <BaseButton variant="default-outline" @click="reset">Nein</BaseButton>
            <BaseButton variant="primary" class="ml-2" @click="applyImport">Ja</BaseButton>
        </template>
    </BaseModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
