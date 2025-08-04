// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

export class SpeechUtils {
  private static recognition: SpeechRecognition | null = null
  private static isListening = false

  static isSupported(): boolean {
    if (typeof window === "undefined") return false

    return ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) && "speechSynthesis" in window
  }

  static initializeRecognition(): SpeechRecognition | null {
    if (typeof window === "undefined") return null

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) return null

      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = "en-US"

      return this.recognition
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error)
      return null
    }
  }

  static startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
  ): boolean {
    if (this.isListening) return false

    const recognition = this.initializeRecognition()
    if (!recognition) {
      onError("Speech recognition not supported")
      return false
    }

    this.isListening = true

    recognition.onresult = (event) => {
      let transcript = ""
      let isFinal = false

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result[0]) {
          transcript += result[0].transcript
          if (result.isFinal) {
            isFinal = true
          }
        }
      }

      onResult(transcript, isFinal)
    }

    recognition.onerror = (event) => {
      this.isListening = false
      onError(`Speech recognition error: ${event.error}`)
    }

    recognition.onend = () => {
      this.isListening = false
      onEnd()
    }

    try {
      recognition.start()
      return true
    } catch (error) {
      this.isListening = false
      onError("Failed to start speech recognition")
      return false
    }
  }

  static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
      }
      this.isListening = false
    }
  }

  static speak(
    text: string,
    options: {
      rate?: number
      pitch?: number
      volume?: number
      voice?: SpeechSynthesisVoice
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: string) => void
    } = {},
  ): boolean {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      options.onError?.("Text-to-speech not supported")
      return false
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1

      if (options.voice) {
        utterance.voice = options.voice
      }

      utterance.onstart = () => options.onStart?.()
      utterance.onend = () => options.onEnd?.()
      utterance.onerror = (event) => options.onError?.(`Speech synthesis error: ${event.error}`)

      window.speechSynthesis.speak(utterance)
      return true
    } catch (error) {
      options.onError?.("Failed to start text-to-speech")
      return false
    }
  }

  static stopSpeaking(): void {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
      } catch (error) {
        console.error("Error stopping speech synthesis:", error)
      }
    }
  }

  static getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return []
    }
    try {
      return window.speechSynthesis.getVoices()
    } catch (error) {
      console.error("Error getting voices:", error)
      return []
    }
  }

  static isListeningActive(): boolean {
    return this.isListening
  }
}

export class AudioUtils {
  static async convertToMp3(audioBlob: Blob): Promise<Blob> {
    // For now, return the original blob
    // In a real implementation, you might want to use a library like lamejs
    return audioBlob
  }

  static async loadAudioFile(file: File): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.onloadeddata = () => {
        URL.revokeObjectURL(url)
        resolve(audio)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load audio file"))
      }

      audio.src = url
    })
  }

  static formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  static async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(audio.duration || 0)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to get audio duration"))
      }

      audio.src = url
    })
  }
}
