/**
 * Cambodian Voice Assistant & Sound Announcement Service
 * Speaks scanned QR details in clear Khmer & English
 */

class VoiceAssistantService {
  private isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qr_voice_assistant_enabled');
      this.isEnabled = stored !== 'false';
    }
  }

  public toggleVoice(enabled?: boolean): boolean {
    this.isEnabled = enabled !== undefined ? enabled : !this.isEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr_voice_assistant_enabled', String(this.isEnabled));
    }
    return this.isEnabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public speak(text: string, lang = 'km-KH') {
    if (!this.isSupported || !this.isEnabled || !text.trim()) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = lang;

      // Pick best matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const khmerVoice = voices.find(
        (v) => v.lang.startsWith('km') || v.lang.includes('KHM') || v.name.toLowerCase().includes('khmer')
      );

      if (khmerVoice) {
        utterance.voice = khmerVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('[VoiceAssistant] Speech error:', e);
    }
  }

  /**
   * Smart announcements based on QR Code type and content
   */
  public announceScanResult(type: string, details?: { amount?: number; currency?: string; title?: string }) {
    if (!this.isEnabled) return;

    if (type === 'KHQR' || type === 'payment') {
      if (details?.amount) {
        const curr = details.currency === 'KHR' ? 'រៀល' : 'ដុល្លារ';
        const amtStr = Number(details.amount).toLocaleString();
        this.speak(`ស្កេន KHQR ជោគជ័យ ចំនួន ${amtStr} ${curr}`);
      } else {
        this.speak('ស្កេន KHQR ជោគជ័យ');
      }
    } else if (type === 'wifi') {
      this.speak('ស្កេនភ្ជាប់វ៉ាយហ្វាយ ជោគជ័យ');
    } else if (type === 'url') {
      this.speak('ស្កេនតំណភ្ជាប់ ជោគជ័យ');
    } else if (type === 'vcard' || type === 'contact') {
      this.speak('ស្កេនទំនាក់ទំនង ជោគជ័យ');
    } else if (type === 'phone') {
      this.speak('ស្កេនលេខទូរស័ព្ទ ជោគជ័យ');
    } else {
      this.speak('ស្កេនជោគជ័យ');
    }
  }

  public announceVipSuccess() {
    if (!this.isEnabled) return;
    this.speak('សូមអបអរសាទរ! ការទូទាត់ជោគជ័យ អ្នកជាសមាជិក VIP មួយជីវិតហើយ');
  }
}

export const voiceAssistant = new VoiceAssistantService();
