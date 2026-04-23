import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

let soundtrack: HTMLAudioElement | null = null
let initialized = false
const WAVE_BAR_COUNT = 5
const IDLE_WAVE_LEVEL = 0.12

function getSoundtrack(): HTMLAudioElement {
  if (!soundtrack) {
    soundtrack = new Audio('/music/piano_0.mp3')
    soundtrack.loop = true
    soundtrack.preload = 'auto'
    soundtrack.volume = 0.20
  }
  return soundtrack
}

export function MiniPlayer() {
  const audio = useMemo(() => getSoundtrack(), [])
  const [isPlaying, setIsPlaying] = useState(!audio.paused)
  const [volume, setVolume] = useState(audio.volume)
  const [waveLevels, setWaveLevels] = useState<number[]>(
    Array.from({ length: WAVE_BAR_COUNT }, () => 0.18)
  )
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const waveOffsetRef = useRef(0)

  const stopWaveAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const ensureAnalyser = useCallback(() => {
    if (analyserRef.current) return analyserRef.current

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
      sourceRef.current.connect(audioContextRef.current.destination)
    }

    const analyser = audioContextRef.current.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.55

    sourceRef.current.connect(analyser)
    analyserRef.current = analyser
    return analyser
  }, [audio])

  const startWaveAnimation = useCallback(() => {
    const analyser = ensureAnalyser()
    if (!analyser) return

    const freqData = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume()
      }

      analyser.getByteFrequencyData(freqData)
      const binCount = freqData.length
      // Scroll bins so the whole row visibly travels; stride spreads bars across the spectrum.
      waveOffsetRef.current = (waveOffsetRef.current + 4) % binCount
      const stride = Math.max(1, Math.floor(binCount / WAVE_BAR_COUNT))

      const levels = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
        const binIndex = (waveOffsetRef.current + index * stride) % binCount
        const sample = freqData[binIndex] ?? 0
        const normalized = sample / 255
        return Math.max(IDLE_WAVE_LEVEL, normalized * 1.35)
      })
      setWaveLevels(levels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    stopWaveAnimation()
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [ensureAnalyser, stopWaveAnimation])

  useEffect(() => {
    const syncPlaying = () => {
      const playing = !audio.paused
      setIsPlaying(playing)
      if (playing) {
        startWaveAnimation()
      } else {
        stopWaveAnimation()
        setWaveLevels(Array.from({ length: WAVE_BAR_COUNT }, () => IDLE_WAVE_LEVEL))
      }
    }
    const syncVolume = () => setVolume(audio.volume)

    audio.addEventListener('play', syncPlaying)
    audio.addEventListener('pause', syncPlaying)
    audio.addEventListener('volumechange', syncVolume)

    const startPlayback = () => {
      const analyser = ensureAnalyser()
      if (analyser && audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume()
      }
      void audio.play().catch(() => {
        // Autoplay may still be blocked until explicit user action.
      })
    }

    if (!initialized) {
      initialized = true
      window.addEventListener('pointerdown', startPlayback, { once: true })
      window.addEventListener('touchstart', startPlayback, { once: true })
      window.addEventListener('keydown', startPlayback, { once: true })
    }

    return () => {
      audio.removeEventListener('play', syncPlaying)
      audio.removeEventListener('pause', syncPlaying)
      audio.removeEventListener('volumechange', syncVolume)
      stopWaveAnimation()
    }
  }, [audio, ensureAnalyser, startWaveAnimation, stopWaveAnimation])

  const togglePlayback = () => {
    const analyser = ensureAnalyser()
    if (analyser && audioContextRef.current?.state === 'suspended') {
      void audioContextRef.current.resume()
    }

    if (audio.paused) {
      void audio.play().catch(() => {
        // Ignore blocked autoplay until next direct interaction.
      })
    } else {
      audio.pause()
    }
  }

  const handleVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    getSoundtrack().volume = next
    setVolume(next)
  }

  return (
    <aside className="absolute left-4 top-4 z-30">
      <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white/90 px-3 py-1.5 text-neutral-900 shadow-lg backdrop-blur-sm dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100">
        <input
          aria-label="Soundtrack volume"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          className="h-1.5 w-20 accent-neutral-800 dark:accent-neutral-200"
        />

        <button
          type="button"
          onClick={togglePlayback}
          className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div
          aria-label={isPlaying ? 'Soundtrack playing' : 'Soundtrack paused'}
          className="flex h-4 max-w-[72px] shrink-0 items-center gap-[3px]"
        >
          {waveLevels.map((level, index) => (
            <span
              key={index}
              className="inline-block w-[2px] shrink-0 rounded-sm bg-sky-400"
              style={{
                height: `${4 + level * 12}px`,
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
