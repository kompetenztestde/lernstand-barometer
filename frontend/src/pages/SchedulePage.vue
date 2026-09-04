<script setup lang="ts"></script>

<template>
    <div class="overflow-x-auto">
        <p class="mb-3">Im Schuljahr 2025/2026 sind folgende Termine im Rahmen der Kompetenztests zu beachten:</p>
        <p class="mb-3"><strong>Anmeldezeitraum:</strong> 01.09. bis 12.09.2025</p>
        <table class="w-full border-collapse">
            <caption class="sr-only">
                Terminplan Kompetenztests Schuljahr 2025/2026
            </caption>
            <thead class="bg-primary border-primary border font-bold text-white">
                <tr>
                    <th scope="col" class="border-r border-white px-2 py-2">Klassenstufe/Fach</th>
                    <th scope="col" class="border-r border-white px-2 py-2">
                        Bereitstellung der Durchführungsmanuale <br />im Schulportal
                    </th>
                    <th scope="col" class="border-r border-white px-2 py-2">Testdurchführung</th>
                    <th scope="col" class="border-r border-white px-2 py-2">Abschluss der Dateneingabe</th>
                    <th scope="col" class="px-2 py-2">Ergebnisrückmeldung</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th id="ks3" scope="rowgroup" colspan="5" class="bg-gray-100 py-4 text-center font-bold">Klassenstufe 3</th>
                </tr>
                <tr>
                    <td headers="ks3">Deutsch (Lesen)</td>
                    <td headers="ks3" class="text-center" rowspan="3">20. April 2026</td>
                    <td headers="ks3">28.04. bis 08.05.2026</td>
                    <td headers="ks3" class="text-center" rowspan="3">22. Mai 2026</td>
                    <td headers="ks3" class="text-center" rowspan="3">10. August 2026</td>
                </tr>
                <tr>
                    <td headers="ks3">Deutsch (Orthografie)</td>
                    <td headers="ks3">28.04. bis 08.05.2026</td>
                </tr>
                <tr>
                    <td headers="ks3">Mathematik</td>
                    <td headers="ks3">28.04. bis 08.05.2026</td>
                </tr>
                <tr>
                    <th id="ks6" scope="rowgroup" colspan="5" class="bg-gray-100 py-4 text-center font-bold">Klassenstufe 6</th>
                </tr>
                <tr>
                    <td headers="ks6">Deutsch</td>
                    <td headers="ks6" class="text-center" rowspan="3">23. Februar 2026</td>
                    <td headers="ks6">03.03. bis 13.03.2026</td>
                    <td headers="ks6" class="text-center" rowspan="3">20. März 2026</td>
                    <td headers="ks6" class="text-center" rowspan="3">02. Juni 2026</td>
                </tr>
                <tr>
                    <td headers="ks6">Mathematik</td>
                    <td headers="ks6">03.03. bis 13.03.2026</td>
                </tr>
                <tr>
                    <td headers="ks6">Englisch</td>
                    <td headers="ks6">03.03. bis 13.03.2026</td>
                </tr>
                <tr>
                    <th id="ks8" scope="rowgroup" colspan="5" class="bg-gray-100 py-4 text-center font-bold">Klassenstufe 8</th>
                </tr>
                <tr>
                    <td headers="ks8">Fremdsprache</td>
                    <td headers="ks8" class="text-center" rowspan="3">23. Februar 2026</td>
                    <td headers="ks8">03.03. bis 13.03.2026</td>
                    <td headers="ks8" class="text-center" rowspan="3">20. März 2026</td>
                    <td headers="ks8" class="text-center" rowspan="3">02. Juni 2026</td>
                </tr>
                <tr>
                    <td headers="ks8">Mathematik</td>
                    <td headers="ks8" colspan="4">03.03. bis 13.03.2026</td>
                </tr>
                <tr>
                    <td headers="ks8">Deutsch</td>
                    <td headers="ks8" colspan="4">03.03. bis 13.03.2026</td>
                </tr>
            </tbody>
        </table>
        <p class="mt-3">
            <strong>Veröffentlichung der Rückmeldungen mit fairen Vergleichswerten :</strong> K6/8: 02. Juni 2026, K3: 10. August 2026
        </p>
    </div>
</template>

<style scoped>
@reference "../style.css";

td,
tbody th {
    @apply border border-gray-200 px-2 py-1;
}
</style>
