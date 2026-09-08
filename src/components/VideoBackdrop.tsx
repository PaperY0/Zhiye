import { useEffect, useRef, useState } from "react"

type VideoBackdropProps = { src: string }

export default function VideoBackdrop({ src }: VideoBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<number | null>(null)
  const restartRef = useRef<number | null>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateOpacity = () => {
      const { currentTime, duration } = video
      if (Number.isFinite(duration) && duration > 0) {
        const fadeWindow = 0.5
        if (currentTime < fadeWindow) setOpacity(currentTime / fadeWindow)
        else if (duration - currentTime < fadeWindow)
          setOpacity(Math.max(0, (duration - currentTime) / fadeWindow))
        else setOpacity(1)
      }
      frameRef.current = requestAnimationFrame(updateOpacity)
    }

    const restart = () => {
      setOpacity(0)
      restartRef.current = window.setTimeout(() => {
        video.currentTime = 0
        const playback = video.play()
        if (playback) void playback.catch(() => undefined)
      }, 100)
    }

    frameRef.current = requestAnimationFrame(updateOpacity)
    video.addEventListener("ended", restart)
    const playback = video.play()
    if (playback) void playback.catch(() => undefined)

    return () => {
      video.removeEventListener("ended", restart)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      if (restartRef.current !== null) window.clearTimeout(restartRef.current)
    }
  }, [src])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[300px] z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        className="h-full w-full object-cover transition-opacity duration-150"
        muted
        playsInline
        preload="auto"
        src={src}
        style={{ opacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
    </div>
  )
}
