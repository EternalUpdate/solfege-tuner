import { useEffect, useState, useRef } from "react";
import "./App.css";
// import * as Pitchfinder from "pitchfinder";
import { Note } from "tonal";
import autoCorrelate from "./PitchDetectionAlgorithms/AutoCorrelate.js";
import { flatChromatics, getSolfege } from "./utils/Solfege";
import AppAudioContext from "./utils/Context";

function App() {
    const [pitch, setPitch] = useState("261.63");
    const [note, setNote] = useState("C");
    const [solfege, setSolfege] = useState("Do");
    const [root, setRoot] = useState("C");
    const [started, setStarted] = useState(false);

    const audioContext = AppAudioContext.getAudioContext();
    const analyser = AppAudioContext.getAnalyser();
    const buffer = AppAudioContext.getBuffer();
    // useRef() to keep these between renders
    const mediaStreamSource = useRef<MediaStreamAudioSourceNode>();
    // keeps track of the current request to avoid concurrent instances of updatePitch() like a semaphore
    const requestId = useRef<number | undefined>();

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
                // create the media stream source and the analyser
                mediaStreamSource.current =
                    audioContext.createMediaStreamSource(stream);

                // connect the media stream source to the analyser
                mediaStreamSource.current.connect(analyser);

                // ready to analyze the pitch of the audio now
                updatePitch();
            })
            .catch((err) => {
                alert("getUserMedia threw exception: " + err);
            });
    }

    // debugging metric to track separate instances of updatePitch()
    // let testCount = 0;

    /**
     * Updates the detected pitch of the audio using the autocorrelation algorithm.
     *
     * resource for using WebAudioAPI's analyzer:
     * https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatTimeDomainData
     */
    function updatePitch() {
        // updatePitch() not in use, set current requestId to undefined
        requestId.current = undefined;

        // go about our business
        if (analyser) {
            analyser.getFloatTimeDomainData(buffer);

            // pitchfinder.js alternatives
            // const detectPitch = Pitchfinder.YIN({ threshold: 0.01 });
            // const detectPitch = Pitchfinder.ACF2PLUS();
            // const pitch = detectPitch(buffer); // doesn't detect below F2, poor bass detection

            // find the pitch using the autocorrelation algorithm
            const pitch = autoCorrelate(buffer, audioContext.sampleRate);

            // console.log(pitch);

            if (pitch) {
                // exclude extremely high frequencies captured
                if (pitch < 7000 && pitch > -1) {
                    setPitch(pitch.toFixed(2)); // limit to 2 decimal places for sanity
                    const note = Note.fromFreq(pitch);
                    setNote(note);
                    // console.log(`testCount: ${testCount++}\troot: ${root}`);
                    setSolfege(getSolfege(note, root));
                }
            }

            // all done, go to our loop handler
            startLoop();
        }
    }

    /**
     * Initializes the tuner by creating a new audio context and calling getUserMedia()
     * to connect to the mic and activate pitch detection.
     */
    function init() {
        // making sure the audio context is created from a user action
        // as requested by new web standards
        audioContext.resume();
        setStarted(true);

        if (!mediaStreamSource.current) {
            // ready to get mic audio
            getUserMedia();
        } else {
            mediaStreamSource.current.connect(analyser);
            updatePitch();
        }
    }

    /**
     * Gatekeeper to starting the updatePitch() loop so that there's one request at a time.
     * Fixes the multiple instances per new key bug.
     */
    function startLoop() {
        // ensure that updatePitch() can only be recursed on if its not busy
        // (current requestId is free)
        if (!requestId.current) {
            // request next animation frame and call updatePitch() again
            requestId.current = window.requestAnimationFrame(updatePitch);
        }
    }

    /**
     * Stops the updatePitch() loop so that there aren't multiple instances running at once (e.g. one per key, which throws off the solfege).
     */
    function stopLoop() {
        // can only access this if you own the requestId
        if (requestId.current) {
            window.cancelAnimationFrame(requestId.current);
            // loop cancelled, give the requestId back (set to undefined) so that someone else can use it!
            requestId.current = undefined;
        }
    }

    /**
     * Stops analysis by interrupting the updatePitch() loop
     * and disconnecting the input stream from the analyser.
     * The microphone does stay connected though.
     *
     * Mostly serves to keep the stop button function distinct from the pure stopLoop() functionality.
     */
    function stopAnalysing() {
        stopLoop();
        mediaStreamSource.current?.disconnect(analyser);
        setStarted(false);
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
        if (mediaStreamSource.current && analyser) {
            stopLoop();
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
                onClick={() => {
                    started ? stopAnalysing() : init();
                }}
                id="start-button"
            >
                {started ? "Stop" : "Start"}
            </button>
            <div className="key-container">
                <div>Choose a key:</div>
                <div className="button-container">{scaleButtons}</div>
            </div>
            {/* <p className="subtitle">
                Refresh the page or close the window to stop using the
                microphone.
            </p> */}
            <div className="footer">
                Brought to you by{" "}
                <a
                    href="https://github.com/EternalUpdate/solfege-tuner"
                    target="_blank"
                >
                    @EternalUpdate
                </a>
            </div>
        </div>
    );
}

export default App;
