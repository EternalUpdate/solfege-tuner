import { useEffect, useState, useRef } from "react";
import "./App.css";
import * as Pitchfinder from "pitchfinder";
import { Note } from "tonal";
import autoCorrelate from "./PitchDetectionAlgorithms/AutoCorrelate.js";

// flat and sharp chromatic scales to figure out the solfege
const flatChromatics = [
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

function App() {
    const [pitch, setPitch] = useState("261.63");
    const [note, setNote] = useState("C");
    const [solfege, setSolfege] = useState("Do");
    const [root, setRoot] = useState("C");

    // useRef() to keep these between renders
    let audioContext = useRef<AudioContext>();
    const analyser = useRef<AnalyserNode>();
    const mediaStreamSource = useRef<MediaStreamAudioSourceNode>();

    /**
     * Connects to the computer's microphone and gets the audio stream.
     * resource: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
     */
    async function getUserMedia() {
        navigator.mediaDevices
            .getUserMedia({
                // requests access to the computer's microphone
                audio: {
                    echoCancellation: true,
                    autoGainControl: false,
                    noiseSuppression: false,
                    latency: 0,
                },
                video: false,
            })
            .then((stream) => {
                // got the audio stream
                if (audioContext.current) {
                    // create the media stream source and the analyser
                    mediaStreamSource.current =
                        audioContext.current.createMediaStreamSource(stream);
                    analyser.current = audioContext.current.createAnalyser();
                    analyser.current.smoothingTimeConstant = 0.85;
                    // connect the media stream source to the analyser
                    mediaStreamSource.current.connect(analyser.current);

                    // ready to analyze the pitch of the audio now
                    updatePitch();
                }
            })
            .catch((err) => {
                alert("getUserMedia threw exception: " + err);
            });
    }

    /**
     * Updates the detected pitch of the audio using the YIN algorithm
     * as implemented in the Pitchfinder.js library.
     *
     * resource for using WebAudioAPI's analyzer:
     * https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData
     */
    function updatePitch() {
        if (analyser.current) {
            // set analyzer settings
            analyser.current.fftSize = 2048;
            const bufferLength = analyser.current.fftSize;
            const buffer = new Float32Array(bufferLength);

            analyser.current.getFloatTimeDomainData(buffer);

            // find the pitch using the YIN algorithm
            // const detectPitch = Pitchfinder.YIN({ threshold: 0.01 });
            // const detectPitch = Pitchfinder.ACF2PLUS();
            // const pitch = detectPitch(buffer); // doesn't detect below F2, poor bass detection
            const pitch = autoCorrelate(buffer, 44100);

            console.log(pitch);

            if (pitch) {
                // exclude extremely high frequencies captured
                if (pitch < 7000 && pitch > -1) {
                    setPitch(pitch.toFixed(2)); // limit to 2 decimal places for sanity
                    const note = Note.fromFreq(pitch);
                    setNote(note);
                    setSolfege(getSolfege(note));
                }
            }

            // request next animation frame and call updatePitch() again
            requestAnimationFrame(updatePitch);
        }
    }

    /**
     * Initializes the tuner by creating a new audio context and calling getUserMedia()
     * to connect to the mic and activate pitch detection.
     */
    function init() {
        // making sure the audio context is created from a user action
        // as requested by new web standards
        (window as any).AudioContext =
            (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContext.current = new AudioContext();

        // ready to get mic audio
        getUserMedia();
    }

    /**
     * Returns the flat chromatic scale starting from the root note.
     * @returns the flat chromatic scale starting from the root note
     */
    function getChromaticScale() {
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
     * @returns the solfege syllable corresponding to note identified in the real time audio
     * based on the scale of the given root note
     */
    function getSolfege(note: string) {
        // get the version of the chromatic scale starting from the root note
        const chromaticScale = getChromaticScale();

        // strip numbers from the note e.g. A4 => A
        const cleanNote = note.replace(/\d+/g, "");

        // with the chromatic scale in order, the solfege syllables will match perfectly
        // e.g. [F, Gb, G, Ab, A, Bb, B, C, ...] => [do, ra, re, me, mi, fa, se, sol, ...]
        const noteIndex = chromaticScale.indexOf(cleanNote);
        const matchedSolfege = solfegeSyllables[noteIndex];

        return matchedSolfege;
    }

    /**
     * Buttons for each note of the chromatic scale as a representation of the root of each scale.
     * Each button updates the root when clicked.
     */
    const scaleButtons = flatChromatics.map((scaleNote) => {
        return (
            <button
                onClick={() => {
                    setRoot(scaleNote);
                }}
            >
                {scaleNote}
            </button>
        );
    });

    /**
     * Makes sure the updatePitch() function refreshes when the root is updated
     * so that the solfege can be calculated with the new root.
     */
    useEffect(() => {
        if (mediaStreamSource.current && analyser.current) {
            updatePitch();
        }
    }, [root]);

    return (
        <div className="App">
            <div className="info-container">
                <div className="note-container">
                    <div id="note">{note}</div>
                    <div id="pitch">{`${pitch} Hz`}</div>
                </div>
                <div id="solfege">{solfege}</div>
            </div>
            <button
                id="start-button"
                onClick={() => {
                    init();
                }}
            >
                Start
            </button>
            {/* <button
                onClick={() => {
                    if (mediaStreamSource.current && analyser.current) {
                        mediaStreamSource.current.disconnect(analyser.current);
                    }
                }}
            >
                Stop
            </button> */}
            <div className="scale-container">
                <div>Choose a scale:</div>
                {/* <div id="root">{root}</div> */}
                <div className="button-container">{scaleButtons}</div>
            </div>
            <div className="footer">
                Brought to you by{" "}
                <a href="https://github.com/EternalUpdate/solfege-tuner">
                    @EternalUpdate
                </a>
            </div>
        </div>
    );
}

export default App;
