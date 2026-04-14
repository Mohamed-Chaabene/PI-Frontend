import {
  Component, Input, OnInit, OnDestroy, inject,
  ElementRef, ViewChild, AfterViewChecked
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Formation } from '../models/formation.model';

interface ChatMessage {
  role:    'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  loading?: boolean;
  isInitial?: boolean;
  isEditing?: boolean;
  editContent?: string;
  editImageUrl?: string;
}

interface ChatSession {
  id: number;
  sessionId: string;
  sessionTitle: string;
  createdAt?: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-chatbot-formation',
  standalone: false,
  templateUrl: './chatbot-formation.component.html',
  styleUrls:  ['./chatbot-formation.component.scss']
})
export class ChatbotFormationComponent
    implements OnInit, OnDestroy, AfterViewChecked {

  @Input() formation!: Formation;
  @Input() context: 'video' | 'ecrite' = 'video';
  @Input() candidatId!: number | null;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private http = inject(HttpClient);

  // ── État chatbot ──────────────────────────────────────────────
  isOpen      = false;
  sessions:   ChatSession[] = [];
  currentSessionId: string | null = null;
  messages:   ChatMessage[] = [];
  inputText = '';
  selectedImageBase64: string | null = null;
  isLoading = false;
  isRenamingSession = false;
  newSessionTitle = '';
  private shouldScrollToBottom = false;

  // ── État vocal ────────────────────────────────────────────────
  isListening  = false;
  isSpeaking   = false;
  voiceEnabled = false;
  private recognition: any = null;
  private synth: SpeechSynthesis = window.speechSynthesis;
  private voicesLoaded = false;

  private readonly base = 'http://localhost:8080/api';

  // ── Suggestions rapides selon contexte ───────────────────────
  get quickSuggestions(): string[] {
    const titre = this.formation?.titre || 'cette formation';
    if (this.context === 'video') {
      return [
        `Résume la formation "${titre}"`,
        `Quels sont les prérequis pour cette formation ?`,
        `Quels projets puis-je faire après cette formation ?`,
        `Explique-moi les concepts clés de ${this.formation?.categorie}`,
      ];
    }
    return [
      `Explique-moi les bases de ${this.formation?.categorie}`,
      `Résume la documentation de cette formation`,
      `Donne-moi des exemples pratiques`,
      `Quelles sont les meilleures pratiques ?`,
    ];
  }

  ngOnInit(): void {
    // Précharger les voix dès que possible
    this.synth.onvoiceschanged = () => {
      this.voicesLoaded = true;
    };
    // Certains navigateurs (Chrome) chargent les voix de façon asynchrone
    if (this.synth.getVoices().length > 0) {
      this.voicesLoaded = true;
    }

    if (this.candidatId && this.formation?.id) {
      this.http.get<ChatSession[]>(`${this.base}/chatbot/history`, {
        params: {
          candidatId: this.candidatId.toString(),
          formationId: this.formation.id.toString()
        }
      }).subscribe({
        next: (hist) => {
          if (hist && hist.length > 0) {
            this.sessions = hist;
            this.currentSessionId = hist[0].sessionId;
            this.messages = hist[0].messages || [];
            if (this.messages.length === 0) {
              this.setInitialMessage();
            }
            this.shouldScrollToBottom = true;
          } else {
            this.setInitialMessage();
          }
        },
        error: () => this.setInitialMessage()
      });
    } else {
      this.setInitialMessage();
    }
  }

  private setInitialMessage(): void {
    this.messages.push({
      role:    'assistant',
      content: `Bonjour ! Je suis votre assistant IA pour la formation **"${this.formation?.titre}"**.\n\nJe peux vous aider à :\n- Résumer des concepts\n- Expliquer des notions difficiles\n- Répondre à vos questions\n- Suggérer des exercices pratiques\n\nQue souhaitez-vous savoir ?`,
      isInitial: true
    });
  }

  ngOnDestroy(): void {
    this.stopListening();
    this.stopSpeaking();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // ── Ouvrir / fermer ───────────────────────────────────────────
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScrollToBottom = true;
      setTimeout(() => this.focusInput(), 100);
    } else {
      // Arrêter tout audio quand on ferme
      this.stopListening();
      this.stopSpeaking();
    }
  }

  closeChat(): void {
    this.isOpen = false;
    this.stopListening();
    this.stopSpeaking();
  }

  // ── Envoyer un message (depuis l'input utilisateur) ───────────
  sendMessage(text?: string): void {
    const msg   = (text || this.inputText).trim();
    const image = text ? null : this.selectedImageBase64;

    if (!msg && !this.selectedImageBase64) return;

    if (!text) {
      this.inputText = '';
      this.selectedImageBase64 = null;
    }

    this.sendMessageWithImage(msg, image);
  }

  // ── Méthode centrale d'envoi ──────────────────────────────────
  sendMessageWithImage(text: string, imageBase64: string | null): void {
    let msg = text.trim();
    if (!msg && !imageBase64) return;
    if (this.isLoading) return;

    // Arrêter la lecture en cours si on envoie un nouveau message
    this.stopSpeaking();

    if (imageBase64 && !msg) {
      msg = "Peux-tu analyser cette image s'il te plaît ?";
    }

    const currentImage = imageBase64;
    this.messages.push({ role: 'user', content: msg, imageUrl: currentImage || undefined });
    this.shouldScrollToBottom = true;

    const loadingMsg: ChatMessage = { role: 'assistant', content: '', loading: true };
    this.messages.push(loadingMsg);
    this.isLoading = true;

    const history = this.messages
      .filter(m => !m.loading && m.content)
      .slice(-10)
      .map(m => {
        const obj: any = { role: m.role, content: m.content };
        if (m.imageUrl) obj.imageUrl = m.imageUrl;
        return obj;
      });

    this.http.post<any>(`${this.base}/chatbot/formation`, {
      message:        msg,
      imageUrl:       currentImage || null,
      titreFormation: this.formation?.titre || '',
      categorie:      this.formation?.categorie || '',
      niveau:         this.formation?.niveau || '',
      context:        this.context,
      formationId:    this.formation?.id,
      candidatId:     this.candidatId,
      sessionId:      this.currentSessionId,
      history
    }).subscribe({
      next: (resp) => {
        const replyText = resp.response || 'Désolé, je n\'ai pas pu répondre.';
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = { role: 'assistant', content: replyText };
        }

        // Lecture vocale automatique de la réponse
        if (this.voiceEnabled) {
          this.speakMessage(replyText);
        }

        if (resp.sessionId && resp.sessionId !== this.currentSessionId) {
          this.currentSessionId = resp.sessionId;
          const existingSession = this.sessions.find(s => s.sessionId === resp.sessionId);
          if (!existingSession) {
            this.sessions.unshift({
              id: 0,
              sessionId:    resp.sessionId,
              sessionTitle: resp.sessionTitle || msg.substring(0, 30),
              messages:     this.messages,
              createdAt:    new Date().toISOString()
            });
          }
        } else if (this.currentSessionId) {
          const session = this.sessions.find(s => s.sessionId === this.currentSessionId);
          if (session) session.messages = [...this.messages];
        }

        this.isLoading            = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = {
            role:    'assistant',
            content: 'Une erreur s\'est produite. Vérifiez votre connexion.'
          };
        }
        this.isLoading = false;
      }
    });
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.currentSessionId = null;
    this.messages = [];
    this.selectedImageBase64 = null;
    this.stopSpeaking();
    this.setInitialMessage();
  }

  // ── Import d'images (Multimodal) ──────────────────────────────
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/*/)) {
      alert("Seules les images sont autorisées.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width  = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width  = MAX_WIDTH;
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          this.selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  removeSelectedImage(): void {
    this.selectedImageBase64 = null;
  }

  selectSession(event: any): void {
    const sessionId = event.target.value;
    if (!sessionId) {
      this.clearChat();
      return;
    }
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      this.currentSessionId    = sessionId;
      this.messages            = session.messages || [];
      if (this.messages.length === 0) this.setInitialMessage();
      this.shouldScrollToBottom = true;
    }
  }

  // ── Renommer Session ──────────────────────────────────────────
  startRenaming(): void {
    if (!this.currentSessionId) return;
    const session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (session) {
      this.newSessionTitle  = session.sessionTitle;
      this.isRenamingSession = true;
    }
  }

  cancelRenaming(): void { this.isRenamingSession = false; }

  saveRenamedSession(): void {
    if (!this.currentSessionId || !this.newSessionTitle.trim()) {
      this.cancelRenaming();
      return;
    }
    const session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (session) {
      session.sessionTitle = this.newSessionTitle.trim();
      this.http.put(`${this.base}/chatbot/session/${this.currentSessionId}`, {
        sessionTitle: session.sessionTitle
      }).subscribe();
    }
    this.isRenamingSession = false;
  }

  deleteCurrentSession(): void {
    if (!this.currentSessionId) return;
    if (!confirm("Voulez-vous vraiment supprimer cette discussion ?")) return;

    this.http.delete(`${this.base}/chatbot/session/${this.currentSessionId}`).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.sessionId !== this.currentSessionId);
        this.clearChat();
      },
      error: (err) => {
        console.error("Failed to delete the session:", err);
        const serverError = err.error?.error ? `\nDétails: ${err.error.error}` : '';
        alert("Erreur lors de la suppression de la discussion. Veuillez réessayer." + serverError);
      }
    });
  }

  // ── Actions Messages ──────────────────────────────────────────
  copyMessage(msg: ChatMessage): void {
    if (msg.content) navigator.clipboard.writeText(msg.content);
  }

  deleteMessage(index: number): void {
    if (index + 1 < this.messages.length && this.messages[index + 1].role === 'assistant') {
      this.messages.splice(index, 2);
    } else {
      this.messages.splice(index, 1);
    }
    this.updateHistoryInDb();
  }

  startEditMessage(msg: ChatMessage): void {
    msg.isEditing    = true;
    msg.editContent  = msg.content;
    msg.editImageUrl = msg.imageUrl;
  }

  cancelEditMessage(msg: ChatMessage): void {
    msg.isEditing    = false;
    msg.editImageUrl = undefined;
  }

  saveEditMessage(index: number, msg: ChatMessage): void {
    const newText = msg.editContent?.trim();
    if (!newText) return;

    const savedImageUrl = msg.editImageUrl || msg.imageUrl || null;
    this.messages = this.messages.slice(0, index);
    this.updateHistoryInDb();
    this.sendMessageWithImage(newText, savedImageUrl);
  }

  private updateHistoryInDb(): void {
    if (!this.currentSessionId) return;
    const session = this.sessions.find(s => s.sessionId === this.currentSessionId);
    if (session) session.messages = [...this.messages];

    this.http.put(`${this.base}/chatbot/session/${this.currentSessionId}`, {
      messages: this.messages
    }).subscribe();
  }

  // ── Formatter le markdown basique ─────────────────────────────
  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,     '<em>$1</em>')
      .replace(/`(.*?)`/g,       '<code>$1</code>')
      .replace(/\n/g,             '<br>')
      .replace(/^- (.*)/gm,       '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  // ══════════════════════════════════════════════════════════════
  // ── ASSISTANT VOCAL ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  // ── Speech-to-Text (STT) ──────────────────────────────────────
  startListening(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.\nUtilisez Chrome ou Edge.");
      return;
    }

    // Bascule : si déjà en écoute, on arrête
    if (this.isListening) {
      this.stopListening();
      return;
    }

    // Arrêter la synthèse vocale si en cours
    this.stopSpeaking();

    this.recognition = new SpeechRecognition();
    this.recognition.lang            = 'fr-FR';
    this.recognition.continuous      = false;
    this.recognition.interimResults  = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      // Agréger tous les résultats intermédiaires
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      this.inputText = transcript;

      // Résultat final → envoyer automatiquement
      if ((event.results[event.results.length - 1] as SpeechRecognitionResult).isFinal) {
        this.stopListening();
        setTimeout(() => {
          if (this.inputText.trim()) this.sendMessage();
        }, 300);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (event.error === 'not-allowed') {
        alert("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.");
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening = false;
  }

  // ── Text-to-Speech (TTS) ──────────────────────────────────────
  speakMessage(text: string): void {
    if (!text) return;
    this.stopSpeaking();

    // Nettoyer le markdown et le HTML avant lecture
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g,     '$1')
      .replace(/`(.*?)`/g,       '$1')
      .replace(/<br\s*\/?>/gi,   ' ')
      .replace(/<[^>]+>/g,       '')
      .replace(/\n+/g,           ' ')
      .replace(/\s+/g,           ' ')
      .trim();

    if (!clean) return;

    const utterance     = new SpeechSynthesisUtterance(clean);
    utterance.lang      = 'fr-FR';
    utterance.rate      = 1.0;
    utterance.pitch     = 1.0;
    utterance.volume    = 1.0;

    // Choisir la meilleure voix française disponible
    const voices    = this.synth.getVoices();
    const frVoices  = voices.filter(v => v.lang.startsWith('fr'));
    // Préférer une voix locale (non réseau) si disponible
    const localVoice = frVoices.find(v => v.localService);
    utterance.voice  = localVoice || frVoices[0] || null;

    utterance.onstart  = () => { this.isSpeaking = true;  };
    utterance.onend    = () => { this.isSpeaking = false; };
    utterance.onerror  = () => { this.isSpeaking = false; };
    utterance.onpause  = () => { this.isSpeaking = false; };
    utterance.onresume = () => { this.isSpeaking = true;  };

    this.synth.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  toggleVoice(): void {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) this.stopSpeaking();
  }

  // ── Vérifier le support du navigateur ────────────────────────
  get isSpeechSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  get isTTSSupported(): boolean {
    return !!window.speechSynthesis;
  }

  // ── Scroll & Focus ────────────────────────────────────────────
  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  private focusInput(): void {
    const input = document.getElementById('chatbot-input');
    input?.focus();
  }
}