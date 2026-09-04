<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { useSchoolLoginMutation, useStudentLoginMutation } from '@/queries/useAuthMutations'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseSelectButton from '@/components/base/BaseSelectButton.vue'
import IconBarometer from '@/components/icons/IconBarometer.vue'
import IconLogin from '@/components/icons/IconLogin.vue'

const surveyId = Number(import.meta.env.VITE_SURVEY_ID)

type FormFields = {
    role: string
    country: string
    schoolnumber: string
    password: string
    studentSchoolnumber: string
    studentCode: string
    studentPassword: string
}

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const schoolLogin = useSchoolLoginMutation()
const studentLogin = useStudentLoginMutation()

const form = reactive<FormFields>({
    role: '',
    country: '',
    schoolnumber: '',
    password: '',
    studentSchoolnumber: '',
    studentPassword: '',
    studentCode: '',
})

const errors = reactive<FormFields>({
    role: '',
    country: '',
    schoolnumber: '',
    password: '',
    studentSchoolnumber: '',
    studentPassword: '',
    studentCode: '',
})

const demoMode = reactive({
    teacher: false,
    student: false,
})

// Initialize state from URL params (enables direct links like ?role=teacher&demo=true)
const queryRole = route.query.role
if (queryRole === 'teacher' || queryRole === 'student') {
    form.role = queryRole
    const queryDemo = route.query.demo === 'true'
    if (queryRole === 'teacher') {
        demoMode.teacher = queryDemo
        if (queryDemo) form.schoolnumber = 'DEMO-TBA3-2026'
    } else {
        demoMode.student = queryDemo
        if (queryDemo) {
            form.studentSchoolnumber = 'DEMO-TBA3-2026'
            form.studentCode = 'aaa'
        }
    }
}

// Watch each field individually so only its error is cleared on change
for (const key of Object.keys(form) as (keyof FormFields)[]) {
    watch(
        () => form[key],
        () => {
            errors[key] = ''
            schoolLogin.reset()
            studentLogin.reset()
        },
    )
}

// Clear errors for the other role's fields when role changes
watch(
    () => form.role,
    (role) => {
        if (role === 'teacher') {
            errors.studentSchoolnumber = ''
            errors.studentCode = ''
            errors.studentPassword = ''
        } else if (role === 'student') {
            errors.country = ''
            errors.schoolnumber = ''
            errors.password = ''
        }
        schoolLogin.reset()
        studentLogin.reset()
    },
)

// Clear errors and prefill demo credentials when demo mode is toggled
watch(
    () => demoMode.teacher,
    (enabled) => {
        errors.country = ''
        errors.password = ''
        errors.schoolnumber = ''
        schoolLogin.reset()
        form.schoolnumber = enabled ? 'DEMO-TBA3-2026' : ''
    },
)

watch(
    () => demoMode.student,
    (enabled) => {
        errors.studentSchoolnumber = ''
        errors.studentPassword = ''
        studentLogin.reset()
        form.studentSchoolnumber = enabled ? 'DEMO-TBA3-2026' : ''
        form.studentCode = enabled ? 'aaa' : ''
    },
)

const isFormValid = computed(() => {
    if (form.role === 'teacher') {
        if (demoMode.teacher) return !!form.schoolnumber
        return !!(form.country && form.schoolnumber && form.password)
    }
    if (form.role === 'student') {
        if (demoMode.student) return !!(form.studentSchoolnumber && form.studentCode)
        return !!(form.studentCode && form.studentPassword)
    }
    return false
})

const isLoading = computed(() => schoolLogin.isPending.value || studentLogin.isPending.value)
const apiError = computed(() => schoolLogin.error.value?.message ?? studentLogin.error.value?.message ?? '')

const germanAlphanumeric = /^[a-zA-Z0-9äöüÄÖÜß]+$/

// Keep URL params in sync so the current selection can be shared as a direct link
watch([() => form.role, () => demoMode.teacher, () => demoMode.student], ([role, demoTeacher, demoStudent]) => {
    const query: Record<string, string> = {}
    if (route.query.redirect) query.redirect = String(route.query.redirect)
    if (role) {
        query.role = role
        query.demo = String(role === 'teacher' ? demoTeacher : demoStudent)
    }
    router.replace({ query })
})

function login() {
    const schoolnumber = form.schoolnumber.trim()
    const password = form.password.trim()
    const studentSchoolnumber = form.studentSchoolnumber.trim()
    const studentPassword = form.studentPassword.trim()
    const studentCode = form.studentCode.trim()

    if (!form.role) {
        errors.role = 'Sie müssen eine Rolle auswählen.'
    } else if (form.role === 'teacher') {
        if (demoMode.teacher) {
            if (!schoolnumber) errors.schoolnumber = 'Sie müssen eine Schulnummer eingeben.'
        } else {
            if (!form.country) errors.country = 'Sie müssen ein Bundesland auswählen.'
            if (!schoolnumber) errors.schoolnumber = 'Sie müssen eine Schulnummer eingeben.'
            else if (!/^[a-zA-Z0-9äöüÄÖÜß-]+$/.test(schoolnumber))
                errors.schoolnumber = 'Die Schulnummer darf nur Buchstaben, Zahlen und Bindestriche enthalten.'
            if (!password) errors.password = 'Sie müssen ein Passwort eingeben.'
            else if (!germanAlphanumeric.test(password)) errors.password = 'Das Passwort darf nur Buchstaben und Zahlen enthalten.'
        }
    } else if (form.role === 'student') {
        if (demoMode.student) {
            if (!studentSchoolnumber) errors.studentSchoolnumber = 'Du musst eine Schulnummer eingeben.'
            if (!studentCode) errors.studentCode = 'Du musst einen Code eingeben.'
            else if (!germanAlphanumeric.test(studentCode)) errors.studentCode = 'Der Code darf nur Buchstaben und Zahlen enthalten.'
        } else {
            if (!studentPassword) errors.studentPassword = 'Du musst ein Passwort eingeben.'
            else if (!germanAlphanumeric.test(studentPassword))
                errors.studentPassword = 'Das Passwort darf nur Buchstaben und Zahlen enthalten.'
            if (!studentCode) errors.studentCode = 'Du musst einen Code eingeben.'
            else if (!germanAlphanumeric.test(studentCode)) errors.studentCode = 'Der Code darf nur Buchstaben und Zahlen enthalten.'
        }
    }

    if (!isFormValid.value) return

    const teacherRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined

    if (form.role === 'teacher' && demoMode.teacher) {
        auth.login(schoolnumber, 'demo')
        router.push(teacherRedirect ?? { name: 'info' })
        return
    }

    if (form.role === 'teacher') {
        schoolLogin.mutate(
            { region: form.country.toUpperCase(), schulNr: schoolnumber, passwort: password },
            {
                onSuccess: (data) => {
                    auth.login(data.token, 'teacher', data.tokenExpiresAt)
                    router.push(teacherRedirect ?? { name: 'info' })
                },
            },
        )
    } else if (form.role === 'student') {
        if (demoMode.student) {
            auth.login(studentSchoolnumber, 'demo-student', undefined, studentCode)
            router.push({ name: 'student-home' })
            return
        }
        studentLogin.mutate(
            { surveyId: surveyId, loginPw: studentPassword, loginCode: studentCode },
            {
                onSuccess: (data) => {
                    auth.login(data.token, 'student', data.tokenExpiresAt, studentCode, data.groupId)
                    router.push({ name: 'student-home' })
                },
            },
        )
    }
}
</script>

<template>
    <div class="mt-8 flex justify-center px-4 xl:mt-24">
        <div>
            <h1 class="flex gap-3 text-3xl font-semibold tracking-wide lg:text-5xl">
                <IconBarometer
                    aria-hidden="true"
                    focusable="false"
                    class="text-primary size-14 -translate-y-1 lg:size-24 lg:-translate-y-4"
                />
                <span class="from-primary to-competence-level-1 font-display bg-linear-50 bg-clip-text text-transparent"
                    ><span>Lernstand</span><span class="text-gray-400">Barometer</span></span
                >
            </h1>
            <div class="bg-surface-1 flex flex-col items-center gap-10 xl:flex-row xl:items-start xl:justify-center xl:gap-16">
                <div class="w-full max-w-160 text-gray-700">
                    <p class="text-center text-lg tracking-wide text-gray-500 lg:text-start xl:text-xl">
                        Prototypisches Rückmeldeportal im
                        <a
                            href="https://zepf.rptu.de/forschung/forschung-alleprojekte/tbaiii"
                            target="_blank"
                            class="text-primary font-bold hover:underline"
                            >Verbundprojekt TBA III</a
                        >, entwickelt vom
                        <a href="https://www.kompetenztest.de" target="_blank" class="text-primary font-bold hover:underline"
                            >Projekt <span class="italic">kompetenztest.de</span></a
                        >
                        der Friedrich-Schiller-Universität Jena.
                    </p>

                    <p class="mt-6 text-center lg:mt-4 lg:text-left">
                        Dieses Portal dient zu Evaluations- und Demonstationszwecken. Wenn Sie nicht Teil der Evaluation sind, können Sie
                        sich mit dem Demo-Zugang anmelden.
                    </p>
                    <div class="mt-8 grid grid-cols-2 items-center gap-6 lg:gap-12">
                        <img src="@/assets/images/uni-jena-logo.jpg" alt="Logo der Universität Jena" class="max-h-16 w-auto" />
                        <img src="@/assets/images/kt-logo.png" alt="Logo der Universität Jena" class="max-h-16 w-auto" />
                    </div>
                </div>
                <div class="bg-surface-2 w-full space-y-4 rounded border border-gray-300 px-8 py-10 md:w-160 xl:w-100">
                    <form @submit.prevent="login">
                        <fieldset class="space-y-3">
                            <div>
                                <label id="role-label" class="mb-1 block font-bold">Rolle</label>
                                <BaseSelectButton
                                    class="w-full"
                                    v-model="form.role"
                                    aria-labelledby="role-label"
                                    :options="[
                                        { value: 'teacher', label: 'Lehrer:in' },
                                        { value: 'student', label: 'Schüler:in' },
                                    ]"
                                />
                                <p v-if="errors.role" role="alert" class="text-sm text-red-700">{{ errors.role }}</p>
                            </div>

                            <div v-if="form.role === 'teacher'">
                                <label class="mb-1 block font-bold">Demo-Zugang</label>
                                <BaseSelectButton
                                    v-model="demoMode.teacher"
                                    :options="[
                                        { value: false, label: 'Nein' },
                                        { value: true, label: 'Ja' },
                                    ]"
                                />
                            </div>

                            <div v-if="form.role === 'teacher' && !demoMode.teacher">
                                <label for="country" class="mb-1 block font-bold" id="country-label">Bundesland</label>
                                <BaseSelect
                                    id="country"
                                    v-model="form.country"
                                    :options="[
                                        { label: 'Sachsen', value: 'sn' },
                                        { label: 'Thüringen', value: 'th' },
                                    ]"
                                    :has-error="errors.country.length > 0"
                                    class="w-full"
                                ></BaseSelect>
                                <p v-if="errors.country" role="alert" class="text-sm text-red-700">{{ errors.country }}</p>
                            </div>

                            <div v-if="form.role === 'teacher'">
                                <label for="schoolnumber" class="mb-1 block font-bold">Schulnummer</label>
                                <input
                                    :disabled="!demoMode.teacher && !form.country"
                                    v-model="form.schoolnumber"
                                    id="schoolnumber"
                                    name="schoolnumber"
                                    type="text"
                                    placeholder="Schulnummer"
                                    class="w-full rounded border border-gray-300 p-2 disabled:cursor-not-allowed disabled:bg-gray-200"
                                    :class="errors.schoolnumber ? 'border-red-700' : ''"
                                />
                                <p v-if="errors.schoolnumber" role="alert" class="text-sm text-red-700">{{ errors.schoolnumber }}</p>
                            </div>

                            <div v-if="form.role === 'teacher' && !demoMode.teacher">
                                <label for="password" class="mb-1 block font-bold">Passwort</label>
                                <input
                                    :disabled="!form.country"
                                    v-model="form.password"
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Passwort"
                                    class="w-full rounded border border-gray-300 p-2 disabled:cursor-not-allowed disabled:bg-gray-200"
                                    :class="errors.password ? 'border-red-700' : ''"
                                />
                                <p v-if="errors.password" role="alert" class="text-sm text-red-700">{{ errors.password }}</p>
                            </div>

                            <div v-if="form.role === 'student'">
                                <label class="mb-1 block font-bold">Demo-Zugang</label>
                                <BaseSelectButton
                                    v-model="demoMode.student"
                                    :options="[
                                        { value: false, label: 'Nein' },
                                        { value: true, label: 'Ja' },
                                    ]"
                                />
                            </div>

                            <div v-if="form.role === 'student' && demoMode.student">
                                <label for="studentSchoolnumber" class="mb-1 block font-bold">Schulnummer</label>
                                <input
                                    v-model="form.studentSchoolnumber"
                                    id="studentSchoolnumber"
                                    name="studentSchoolnumber"
                                    type="text"
                                    placeholder="Schulnummer"
                                    class="w-full rounded border border-gray-300 p-2"
                                    :class="errors.studentSchoolnumber ? 'border-red-700' : ''"
                                />
                                <p v-if="errors.studentSchoolnumber" role="alert" class="text-sm text-red-700">
                                    {{ errors.studentSchoolnumber }}
                                </p>
                            </div>

                            <div v-if="form.role === 'student' && !demoMode.student">
                                <label for="studentPassword" class="mb-1 block font-bold">Passwort</label>
                                <input
                                    v-model="form.studentPassword"
                                    id="studentPassword"
                                    name="studentPassword"
                                    type="text"
                                    placeholder="Passwort"
                                    class="w-full rounded border border-gray-300 p-2"
                                    :class="errors.studentPassword ? 'border-red-700' : ''"
                                />
                                <p v-if="errors.studentPassword" role="alert" class="text-sm text-red-700">{{ errors.studentPassword }}</p>
                            </div>

                            <div v-if="form.role === 'student'">
                                <label for="studentCode" class="mb-1 block font-bold">Code</label>
                                <input
                                    v-model="form.studentCode"
                                    id="studentCode"
                                    name="studentCode"
                                    type="password"
                                    placeholder="Code"
                                    class="w-full rounded border border-gray-300 p-2"
                                    :class="errors.studentCode ? 'border-red-700' : ''"
                                />
                                <p v-if="errors.studentCode" role="alert" class="text-sm text-red-700">{{ errors.studentCode }}</p>
                            </div>

                            <p v-if="apiError" role="alert" class="text-sm text-red-700">{{ apiError }}</p>

                            <BaseButton type="submit" class="mt-3 w-full gap-1" variant="primary" :disabled="isLoading">
                                <span>{{ isLoading ? 'Bitte warten...' : 'Anmelden' }}</span>
                                <IconLogin />
                            </BaseButton>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
