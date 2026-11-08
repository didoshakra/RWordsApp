// src/utils/azureTTS.js
import {AZURE_KEY} from '@/config/secrets';

const AZURE_REGION = 'westeurope';
export const AZURE_VOICE_UK_MALE = 'uk-UA-OstapNeural';
export const AZURE_VOICE_UK_FEMALE = 'uk-UA-PolinaNeural';

export const azureSpeak = async (text, voice = AZURE_VOICE_UK_MALE) => {
  const url = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

  const ssml = `
    <speak version='1.0' xml:lang='uk-UA'>
      <voice name='${voice}'>
        ${text}
      </voice>
    </speak>`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    body: ssml,
  });

  if (!response.ok) throw new Error(`Azure TTS error: ${response.status}`);

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // повертає base64
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
