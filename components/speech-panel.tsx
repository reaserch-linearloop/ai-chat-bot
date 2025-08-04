"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Pause,
  Square,
  Trash2,
  Download,
  Settings,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { SpeechUtils, AudioUtils } from "@/lib/speech-utils"

interface SpeechPanelProps {
  onTranscriptChange: (transcript: string) => void
  onSpeakText: (text: string) => void
  lastAssistantMessage?: string
  isVisible: boolean
  onToggleVisibility: () => void
}

interface AudioFile {
  id: string
  name: string
  file: File
  duration: number
  url: string
}

export function SpeechPanel({
  onTranscriptChange,
  onSpeakText,
  lastAssistantMessage,
  isVisible,
  onToggleVisibility,
}: SpeechPanelProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  // Audio settings
  const [speechRate, setSpeechRate] = useState([1])
  const [speechPitch, setSpeechPitch] = useState([1])
  const [speechVolume, setSpeechVolume] = useState([1])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // Audio files
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize speech support and voices
  useEffect(() => {
    setIsSupported(SpeechUtils.isSupported())

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = SpeechUtils.getVoices()
        setVoices(availableVoices)
        if (availableVoices.length > 0 && !selectedVoice) {
          // Prefer English voices
          const englishVoice = availableVoices.find((voice) => voice.lang.startsWith("en"))
          setSelectedVoice(englishVoice || availableVoices[0])
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [selectedVoice])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      SpeechUtils.stopListening()
      SpeechUtils.stopSpeaking()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in your browser")
      return
    }

    setError(null)
    setTranscript("")
    setInterimTranscript("")

    const success = SpeechUtils.startListening(
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(text)
          setInterimTranscript("")
          onTranscriptChange(text)
        } else {
          setInterimTranscript(text)
        }
      },
      (errorMessage) => {
        setError(errorMessage)
        setIsListening(false)
      },
      () => {
        setIsListening(false)
        setInterimTranscript("")
      },
    )

    if (success) {
      setIsListening(true)
    }
  }, [isSupported, onTranscriptChange])

  const stopListening = useCallback(() => {
    SpeechUtils.stopListening()
    setIsListening(false)
    setInterimTranscript("")
  }, [])

  const speakText = useCallback(
    (text: string) => {
      if (!text.trim()) return

      setError(null)
      setIsSpeaking(true)

      SpeechUtils.speak(text, {
        rate: speechRate[0],
        pitch: speechPitch[0],
        volume: speechVolume[0],
        voice: selectedVoice || undefined,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (errorMessage) => {
          setError(errorMessage)
          setIsSpeaking(false)
        },
      })
    },
    [speechRate, speechPitch, speechVolume, selectedVoice],
  )

  const stopSpeaking = useCallback(() => {
    SpeechUtils.stopSpeaking()
    setIsSpeaking(false)
  }, [])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("audio/")) {
          setError(`${file.name} is not an audio file`)
          continue
        }

        const duration = await AudioUtils.getAudioDuration(file)
        const url = URL.createObjectURL(file)

        const audioFile: AudioFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          file,
          duration,
          url,
        }

        setAudioFiles((prev) => [...prev, audioFile])
      }
    } catch (error) {
      setError("Failed to process audio file(s)")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [])

  const playAudio = useCallback(async (audioFile: AudioFile) => {
    try {
      // Stop current audio if playing
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const audio = await AudioUtils.loadAudioFile(audioFile.file)
      currentAudioRef.current = audio

      audio.ontimeupdate = () => {
        const progress = (audio.currentTime / audio.duration) * 100
        setPlaybackProgress(progress)
      }

      audio.onended = () => {
        setCurrentlyPlaying(null)
        setPlaybackProgress(0)
        currentAudioRef.current = null
      }

      audio.onerror = () => {
        setError("Failed to play audio file")
        setCurrentlyPlaying(null)
        setPlaybackProgress(0)
        currentAudioRef.current = null
      }

      await audio.play()
      setCurrentlyPlaying(audioFile.id)
    } catch (error) {
      setError("Failed to play audio file")
    }
  }, [])

  const pauseAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      setCurrentlyPlaying(null)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setCurrentlyPlaying(null)
      setPlaybackProgress(0)
    }
  }, [])

  const removeAudioFile = useCallback(
    (audioFile: AudioFile) => {
      if (currentlyPlaying === audioFile.id) {
        stopAudio()
      }
      URL.revokeObjectURL(audioFile.url)
      setAudioFiles((prev) => prev.filter((file) => file.id !== audioFile.id))
    },
    [currentlyPlaying, stopAudio],
  )

  const downloadAudio = useCallback((audioFile: AudioFile) => {
    const link = document.createElement("a")
    link.href = audioFile.url
    link.download = audioFile.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
      >
        <Mic className="w-4 h-4 mr-2" />
        Speech
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            Speech & Audio
          </CardTitle>
          <Button onClick={onToggleVisibility} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Speech Recognition */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Speech to Text
          </h3>

          {!isSupported ? (
            <Alert>
              <AlertDescription className="text-sm">
                Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "destructive" : "default"}
                  className="flex-1"
                  disabled={isSpeaking}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Listening
                    </>
                  )}
                </Button>
              </div>

              {(transcript || interimTranscript) && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-900">{transcript}</p>
                  {interimTranscript && <p className="text-sm text-gray-500 italic">{interimTranscript}</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Text to Speech */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Text to Speech
          </h3>

          <div className="flex gap-2">
            <Button
              onClick={() => lastAssistantMessage && speakText(lastAssistantMessage)}
              disabled={!lastAssistantMessage || isSpeaking || isListening}
              variant="outline"
              className="flex-1"
            >
              {isSpeaking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speaking...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Speak Last Response
                </>
              )}
            </Button>

            {isSpeaking && (
              <Button onClick={stopSpeaking} variant="destructive" size="sm">
                <VolumeX className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Voice Settings */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Voice Settings
            </summary>
            <div className="mt-3 space-y-3 pl-4">
              {/* Voice Selection */}
              {voices.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Voice</label>
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => {
                      const voice = voices.find((v) => v.name === e.target.value)
                      setSelectedVoice(voice || null)
                    }}
                    className="w-full mt-1 text-xs border border-gray-200 rounded px-2 py-1"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rate */}
              <div>
                <label className="text-xs font-medium text-gray-700">Rate: {speechRate[0].toFixed(1)}x</label>
                <Slider
                  value={speechRate}
                  onValueChange={setSpeechRate}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              {/* Pitch */}
              <div>
                <label className="text-xs font-medium text-gray-700">Pitch: {speechPitch[0].toFixed(1)}</label>
                <Slider
                  value={speechPitch}
                  onValueChange={setSpeechPitch}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-1"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Volume: {Math.round(speechVolume[0] * 100)}%
                </label>
                <Slider
                  value={speechVolume}
                  onValueChange={setSpeechVolume}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-1"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Audio File Upload */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Audio Files
          </h3>

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload MP3/Audio
                </>
              )}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Audio Files List */}
          {audioFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {audioFiles.map((audioFile) => (
                <div key={audioFile.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{audioFile.name}</p>
                    <p className="text-xs text-gray-500">{AudioUtils.formatDuration(audioFile.duration)}</p>

                    {currentlyPlaying === audioFile.id && <Progress value={playbackProgress} className="mt-2 h-1" />}
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {currentlyPlaying === audioFile.id ? (
                      <>
                        <Button onClick={pauseAudio} size="sm" variant="ghost">
                          <Pause className="w-3 h-3" />
                        </Button>
                        <Button onClick={stopAudio} size="sm" variant="ghost">
                          <Square className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => playAudio(audioFile)} size="sm" variant="ghost">
                        <Play className="w-3 h-3" />
                      </Button>
                    )}

                    <Button onClick={() => downloadAudio(audioFile)} size="sm" variant="ghost">
                      <Download className="w-3 h-3" />
                    </Button>

                    <Button
                      onClick={() => removeAudioFile(audioFile)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
