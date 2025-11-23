
export const playNotification = (text: string, type: 'success' | 'error' = 'success') => {
  if (!('speechSynthesis' in window)) return;

  // Cancel any currently speaking audio to prevent overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Attempt to select a clear English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  utterance.rate = 1.0;
  utterance.pitch = type === 'success' ? 1.1 : 0.9;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};
