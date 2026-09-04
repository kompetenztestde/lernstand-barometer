import type { TaskDetailPanelProps } from './types'

export const mockTaskDetailPanelProps: TaskDetailPanelProps = {
    iqbId: 'iDL001A01',
    taskNumber: '1.1',
    name: 'Sportunterricht',
    isExpanded: true,
    competenceLevelRoman: 'III',
    compLvlSubtitle: 'Regelstandard',
    compLvlDescription: 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen',
    competenceId: {
        name: 'Lesen – mit Texten und anderen Medien umgehen',
        nameShort: 'L3',
        description: 'Texte verstehen und nutzen',
    },
    cognitiveDemandLevel: {
        name: 'Reproduzieren',
        nameShort: 'I',
        description: 'Grundlegende Operationen und bekannte Sachverhalte wiedergeben',
    },
}
