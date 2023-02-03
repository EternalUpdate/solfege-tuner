import { useEffect, useState, useRef } from "react";
import "./App.css";
import * as Pitchfinder from "pitchfinder";
import { Note } from "tonal";
import autoCorrelate from "./PitchDetectionAlgorithms/AutoCorrelate.js";
import { flatChromatics, getSolfege } from "./utils/Solfege";

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
     * Updates the detected pitch of the audio using the autocorrelation algorithm.
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

            // find the pitch using the autocorrelation algorithm
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
                    setSolfege(getSolfege(note, root));
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
