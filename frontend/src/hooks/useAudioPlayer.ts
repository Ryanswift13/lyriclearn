import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../store/playerStore'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { audioUrl, isPlaying, playbackRate, setIsPlaying, setCurrentTime, setDuration } =
    usePlayerStore()

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    const onDurationChange = () => setDuration(isNaN(audio.duration) ? 0 : audio.duration)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return
    audioRef.current.src = audioUrl
    audioRef.current.load()
    setIsPlaying(true)
  }, [audioUrl])

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false))
    else audioRef.current.pause()
  }, [isPlaying])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  // RAF loop for smooth currentTime (karaoke needs ~60fps)
  useEffect(() => {
    if (!isPlaying) return
    let rafId: number
    const tick = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  return { audioRef, seek }
}
