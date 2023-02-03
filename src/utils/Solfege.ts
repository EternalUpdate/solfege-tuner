// flat and sharp chromatic scales to figure out the solfege
export const flatChromatics = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
];

const sharpChromatics = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];

const solfegeSyllables = [
    "do",
    "ra",
    "re",
    "me",
    "mi",
    "fa",
    "se",
    "sol",
    "le",
    "la",
    "te",
    "ti",
];

/**
 * Returns the flat chromatic scale starting from the root note.
 * @param root root of the scale
 * @returns the flat chromatic scale starting from the root note
 */
function getChromaticScale(root: string) {
    let startIndex = 0;
    let chromaticScale = [];

    // match the root with either flat or sharp chromatics
    if (flatChromatics.includes(root)) {
        startIndex = flatChromatics.indexOf(root);
    } else if (sharpChromatics.includes(root)) {
        startIndex = sharpChromatics.indexOf(root);
    }

    // build the flat chromatic scale starting from the root
    for (let i = 0; i < flatChromatics.length; i++) {
        chromaticScale.push(
            // wrap around the scale with the magic of modulo
            flatChromatics[(startIndex + i) % flatChromatics.length]
        );
    }

    return chromaticScale;
}

/**
 * Get the solfege syllable corresponding to note identified in the real time audio
 * based on the scale of the given root note.
 * It is based on the major scale.
 * e.g. Eb with a root note of C will result in the solfege syllable "me".
 *
 * @param note identified from the analysis of the microphone audio
 * @param root root of the scale
 * @returns the solfege syllable corresponding to note identified in the real time audio
 * based on the scale of the given root note
 */
export function getSolfege(note: string, root: string) {
    // get the version of the chromatic scale starting from the root note
    const chromaticScale = getChromaticScale(root);

    // strip numbers from the note e.g. A4 => A
    const cleanNote = note.replace(/\d+/g, "");

    // with the chromatic scale in order, the solfege syllables will match perfectly
    // e.g. [F, Gb, G, Ab, A, Bb, B, C, ...] => [do, ra, re, me, mi, fa, se, sol, ...]
    const noteIndex = chromaticScale.indexOf(cleanNote);
    const matchedSolfege = solfegeSyllables[noteIndex];

    return matchedSolfege;
}