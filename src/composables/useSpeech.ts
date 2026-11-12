import { ref } from 'vue'

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number }
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function useSpeech() {
  const supported = ref(typeof window !== 'undefined' && !!getRecognition())
  const listening = ref(false)
  const transcript = ref('')
  const error = ref('')

  let recognition: SpeechRecognitionLike | null = null

  function stop() {
    try {
      recognition?.abort()
    } catch {
      /* ignore */
    }
    listening.value = false
  }

  function start(lang = 'en-US'): Promise<string> {
    error.value = ''
    transcript.value = ''
    return new Promise((resolve, reject) => {
      recognition = getRecognition()
      if (!recognition) {
        supported.value = false
        const msg = 'Распознавание недоступно. Используй диктовку клавиатуры или чат.'
        error.value = msg
        reject(new Error(msg))
        return
      }

      recognition.lang = lang
      recognition.interimResults = false
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onresult = (ev) => {
        const text = ev.results[0]?.[0]?.transcript?.trim() ?? ''
        transcript.value = text
        listening.value = false
        resolve(text)
      }

      recognition.onerror = (ev) => {
        listening.value = false
        error.value = ev.error || 'error'
        reject(new Error(error.value))
      }

      recognition.onend = () => {
        listening.value = false
      }

      try {
        listening.value = true
        recognition.start()
      } catch (e) {
        listening.value = false
        reject(e)
      }
    })
  }

  return { supported, listening, transcript, error, start, stop }
}
