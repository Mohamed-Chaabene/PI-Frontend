import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../services/chat-service';
import Pusher from 'pusher-js';
import { jwtDecode } from 'jwt-decode';

@Component({
    selector: 'app-chat-evenement',
    standalone: false,
    templateUrl: './evenement-chat.component.html',
    styleUrls: ['./evenement-chat.component.scss']
})
export class ChatEvenementComponent implements OnInit, OnDestroy, AfterViewChecked {

    @Input() evenementId!: number;
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

    messages: any[] = [];
    nouveauMessage = '';
    candidatId!: number;
    nomCandidat = '';
    chatOuvert = false;
    isLoading = true;
    erreur = '';
    envoyerEnCours = false;

    private channel: any;
    private pusher: any;
    private doitScroller = false;

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        const idFromRoute = this.route.snapshot.paramMap.get('evenementId');
        if (idFromRoute) {
            this.evenementId = Number(idFromRoute);
        }

        if (!this.evenementId) {
            this.erreur = 'Événement non trouvé';
            this.isLoading = false;
            return;
        }

        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            this.candidatId = decoded?.id;
            this.nomCandidat = decoded?.nom || 'Candidat';
        }

        this.chatService.getChatStatut(this.evenementId).subscribe({
            next: (ouvert) => {
                this.chatOuvert = ouvert;
                this.isLoading = false;
                if (ouvert) {
                    this.chargerMessages();
                    this.connecterPusher();
                }
            },
            error: (err) => {
                console.error('Erreur statut chat:', err);
                this.erreur = 'Impossible de joindre le backend.';
                this.isLoading = false;
            }
        });
    }

    ngAfterViewChecked() {
        if (this.doitScroller) {
            this.scrollerVersLeBas();
            this.doitScroller = false;
        }
    }

    chargerMessages() {
        this.chatService.getMessages(this.evenementId, this.candidatId).subscribe({
            next: (data) => {
                this.messages = data;
                this.doitScroller = true;
            },
            error: (err) => console.error('Erreur messages:', err)
        });
    }

    connecterPusher() {
        // ✅ SOLUTION : nouvelle instance Pusher SANS authorizer
        // L'instance du PusherService a un authorizer qui intercepte tous les canaux.
        // Ici on crée une instance fraîche, minimaliste, uniquement pour le chat public.
        // Les canaux publics (sans préfixe "private-") ne déclenchent jamais d'auth.
        this.pusher = new Pusher('07a41117ca80364c7695', {
            cluster: 'eu'
            // Pas d'authorizer → Pusher ne tentera jamais d'appeler /pusher/auth
        });

        this.pusher.connection.bind('connected', () => {
            console.log('Pusher chat connecté ✅');
        });

        // Canal public : "chat-evenement-X" sans préfixe "private-"
        this.channel = this.pusher.subscribe(`chat-evenement-${this.evenementId}`);

        this.channel.bind('pusher:subscription_succeeded', () => {
            console.log('Abonné au canal chat ✅');
        });

        // Chaque message reçu est ajouté à la liste — valable pour tous les utilisateurs
        // y compris l'expéditeur lui-même (donc ne pas faire push dans envoyer())
        this.channel.bind('nouveau-message', (data: any) => {
            this.messages.push(data);
            this.doitScroller = true;
        });
    }

    envoyer() {
        if (!this.nouveauMessage.trim() || this.envoyerEnCours) return;

        const payload = {
            evenementId: this.evenementId,
            candidatId: this.candidatId,
            contenu: this.nouveauMessage.trim()
        };

        this.envoyerEnCours = true;

        this.chatService.envoyer(payload).subscribe({
            next: () => {
                // ✅ On vide le champ uniquement — le message arrive via Pusher
                // Ne jamais faire this.messages.push(...) ici → doublon garanti
                this.nouveauMessage = '';
                this.envoyerEnCours = false;
            },
            error: (err) => {
                console.error('Erreur envoi:', err);
                this.envoyerEnCours = false;
            }
        });
    }

    // Envoyer avec Entrée (Shift+Entrée = saut de ligne)
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.envoyer();
        }
    }

    formatHeure(value: any): string {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    private scrollerVersLeBas() {
        try {
            const el = this.messagesContainer.nativeElement;
            el.scrollTop = el.scrollHeight;
        } catch (err) {}
    }

    ngOnDestroy() {
        if (this.channel) this.channel.unbind_all();
        if (this.pusher) this.pusher.disconnect();
    }
}