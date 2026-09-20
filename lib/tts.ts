import * as Speech from 'expo-speech';

export async function speakWord(word: string, rate: number = 1.0, language: string = 'en-GB'): Promise<void> {
  try {
    await Speech.speak(word, {
      language,
      rate: Math.max(0.5, Math.min(1.2, rate)),
      onDone: () => {
        console.log('Speech finished');
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
  }
}

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('Stop speech error:', error);
  }
}

export async function getAvailableVoices() {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error('Get voices error:', error);
    return [];
  }
}
