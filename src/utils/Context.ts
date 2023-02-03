(window as any).AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
const audioContext = new AudioContext();

const analyser = audioContext.createAnalyser();
// set analyzer settings
analyser.fftSize = 2048;
const bufferLength = analyser.fftSize;

// buffer must be Float32Array as per the WebAudioAPI docs
const buffer = new Float32Array(bufferLength);

const AppAudioContext = {
    getAudioContext() {
        return audioContext;
    },

    getAnalyser() {
        return analyser;
    },

    getBuffer() {
        return buffer;
    }
};

export default AppAudioContext;

