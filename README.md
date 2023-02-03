# solfege-tuner
This is a tuner web app that attempts to show the solfege syllable that is played / sung in real-time, corresponding to a user-chosen scale.

Microphone audio is captured using the [WebAudioAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and this audio is analyzed using the autocorrelation pitch detection algorithm found in the projects acknowledged below. The [pitchfinder.js](https://github.com/peterkhayes/pitchfinder) library also offers a variety of other pitch detection algorithm, such as the YIN algorithm. 

Some very limited use is made of the [tonal.js](https://github.com/tonaljs/tonal) library, but at this place it could easily be replaced by a single function.

`solfege-tuner` is implemented in Typescript using the React framework and Vite.js.

This is meant as an educational tool.

## Installation
`npm install` the dependencies, and `npm run dev`.

## Link
https://solfege-tuner.netlify.app/

## Possible Improvements
* Making the display of pitch, notes, and solfege syllables less jerky so that users can anticipate when the pitch is about to change, perhaps with a visual
* Adding a visual corresponding to audio input, so that the user has more feedback that the app is working
* Convert into a PWA for offline use

## Acknowledgements
The following open source projects were used as references to learn how to use the WebAudioAPI:
* [webaudio-pitch-tuner](https://github.com/dgvai/webaudio-pitch-tuner/blob/master/src/index.js)
* [celeste-tuner](https://github.com/pmoieni/celeste-tuner/blob/main/src/lib/Tuner.svelte)

