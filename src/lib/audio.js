// CONCEPT: Web Audio API oscillator — generates a beep without needing an audio file.
// We create a short 880Hz tone with an exponential volume fade, wrapped in try/catch
// because autoplay policies can block AudioContext creation without user interaction.
export function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch (e) {
    // CONCEPT: audio play() catch — autoplay restrictions mean we must silently
    // swallow failures; the visual flash still alerts the user.
    console.warn('Audio playback blocked:', e)
  }
}