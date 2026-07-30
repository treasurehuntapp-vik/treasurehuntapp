// ============================================================
// GENERATORE DI INDIZI PERTINENTI
// ============================================================

const templates = {
    'castle': [
        'Tra le mura antiche di {name}, un segreto attende chi sa guardare.',
        'Sali in alto a {name} e scopri la storia che custodisce.',
        'Le pietre di {name} raccontano storie di cavalieri e battaglie.',
        'Nelle torri di {name}, un tesoro aspetta chi osa salire.'
    ],
    'place_of_worship': [
        'Dove le campane suonano a {name}, un messaggio è nascosto tra le pietre.',
        'La luce che filtra dalle vetrate di {name} illumina il tuo cammino.',
        'Nella quiete di {name}, ascolta il silenzio che parla.'
    ],
    'park': [
        'Nel verde di {name}, dove gli alberi sussurrano, un tesoro ti aspetta.',
        'Seguendo il sentiero di {name}, scoprirai un segreto della natura.',
        'Tra le foglie e i rami di {name}, la natura nasconde i suoi doni.'
    ],
    'museum': [
        'Tra opere d\'arte e storia a {name}, un tesoro attende il cercatore.',
        'Le stanze di {name} custodiscono segreti che solo i più attenti scoprono.',
        'Nel cuore della cultura a {name}, un indizio ti guiderà.'
    ],
    'tourism': [
        'A {name}, un tesoro aspetta chi sa guardare oltre l\'apparenza.',
        'Le pietre di {name} custodiscono un segreto. Sta a te scoprirlo.',
        'Nel cuore di {name}, un messaggio attende il tuo sguardo attento.'
    ],
    'default': [
        'A {name}, un tesoro aspetta chi sa guardare oltre l\'apparenza.',
        'Le pietre di {name} custodiscono un segreto. Sta a te scoprirlo.',
        'Nel cuore di {name}, un messaggio attende il tuo sguardo attento.',
        'Esplorando {name}, scoprirai un segreto nascosto nel tempo.'
    ]
};

export function generateClue(landmark) {
    const type = landmark.type || 'default';
    const clues = templates[type] || templates.default;
    const clue = clues[Math.floor(Math.random() * clues.length)];
    return clue.replace(/{name}/g, landmark.name);
}

export function generateTitle(landmark) {
    const emojis = {
        'castle': '🏰',
        'place_of_worship': '⛪',
        'park': '🌳',
        'museum': '🏛️',
        'tourism': '📍',
        'default': '📌'
    };
    const emoji = emojis[landmark.type] || '📌';
    return `${emoji} ${landmark.name}`;
}