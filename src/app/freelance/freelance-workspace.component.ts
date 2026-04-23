import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FreelanceWorkspaceService, FreelanceContract, FreelanceChatRoom, FreelanceChatMessage } from './services/freelance-workspace.service';
import { RoleSwitchService } from './services/role-switch.service';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ApexStroke
} from "ng-apexcharts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SignaturePad from 'signature_pad';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-freelance-workspace',
  standalone: false,
  templateUrl: './freelance-workspace.component.html'
})
export class FreelanceWorkspaceComponent implements OnInit, OnDestroy {
  mode: string = 'FREELANCER';
  myContracts: FreelanceContract[] = [];
  myRooms: FreelanceChatRoom[] = [];
  
  // Selected state
  selectedContract: FreelanceContract | null = null;
  selectedRoom: FreelanceChatRoom | null = null;
  messages: FreelanceChatMessage[] = [];
  
  newMessage: string = '';
  isTyping = false;
  typingTimeout: any;
  messagePolling: any;
  lastMessageCount = 0;
  showEmojiPicker = false;
  readonly EMOJIS = ['😊','👍','🔥','✅','❌','🚀','💡','📌','🎯','💰','📝','🤝','⚠️','🎉'];
  
  // Smart Contract & Milestones state
  showStripeModal = false;
  stripeToken = '';
  stripeAmount = 0;
  stripeError = '';
  stripeProcessing = false;
  stripeSuccess = false;
  
  // Upwork-style Payment Form
  paymentMethod: 'card' | 'paypal' = 'card';
  ccFirstName = '';
  ccLastName = '';
  ccNumber = '';
  ccExpiry = '';
  ccCvc = '';
  
  // Analytics Chart
  public chartOptions: Partial<ChartOptions> | any;
  
  newMilestone = {
    title: '',
    description: '',
    amount: 0,
    dueDate: ''
  };
  
  @ViewChild('sigPad') sigPadElement!: ElementRef;
  sigPad: SignaturePad | undefined;
  showSignModal = false;
  signMode: 'type' | 'draw' = 'type';
  typedSignature: string = '';
  
  constructor(
    private workspaceService: FreelanceWorkspaceService,
    private roleSwitchService: RoleSwitchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roleSwitchService.mode$.subscribe(m => {
      this.mode = m;
      this.loadData();
    });
    this.initChart();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.stopPolling();
    this.messagePolling = setInterval(() => {
      if (!this.selectedRoom) return;
      this.workspaceService.getRoomMessages(this.selectedRoom.id).subscribe(res => {
        if (res.length !== this.lastMessageCount) {
          this.messages = res;
          this.lastMessageCount = res.length;
          this.scrollToBottom();
        }
      });
    }, 3000);
  }

  stopPolling(): void {
    if (this.messagePolling) {
      clearInterval(this.messagePolling);
      this.messagePolling = null;
    }
  }

  initChart(): void {
    this.chartOptions = {
      series: [0, 0],
      chart: {
        height: 200,
        type: "radialBar"
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: "14px"
            },
            value: {
              fontSize: "16px"
            },
            total: {
              show: true,
              label: "Progression",
              formatter: function(w: any) {
                return "";
              }
            }
          }
        }
      },
      labels: ["Escrowed", "Paid"],
      colors: ["#f59e0b", "#10b981"],
      stroke: {
        lineCap: "round"
      }
    };
  }

  updateChart(): void {
    if (!this.selectedContract) return;
    const escrowPct = (this.selectedContract.inEscrow / this.selectedContract.amount) * 100;
    const paidPct = (this.selectedContract.totalPaid / this.selectedContract.amount) * 100;
    this.chartOptions.series = [Math.round(escrowPct), Math.round(paidPct)];
  }

  loadData(): void {
    this.workspaceService.getMyContracts().subscribe(res => {
      this.myContracts = res;
      if (this.selectedContract) {
        const updated = res.find(c => c.id === this.selectedContract!.id);
        if (updated) {
          this.selectedContract = updated;
          this.updateChart();
        }
      }
    });
    this.workspaceService.getMyRooms().subscribe(res => {
      this.myRooms = res;
    });
  }

  selectContract(c: FreelanceContract): void {
    this.selectedContract = c;
    this.updateChart();
    
    this.workspaceService.getOrCreateRoom(c.missionId, c.freelancerId).subscribe(room => {
      this.selectedRoom = room;
      this.messages = [];
      this.lastMessageCount = 0;
      this.loadMessages();
      this.startPolling();
    });
  }

  loadMessages(): void {
    if (!this.selectedRoom) return;
    this.workspaceService.getRoomMessages(this.selectedRoom.id).subscribe(res => {
      this.messages = res;
      this.scrollToBottom();
    });
  }

  acceptContract(): void {
    if (!this.selectedContract) return;
    this.signMode = 'type';
    this.typedSignature = '';
    this.showSignModal = true;
  }

  initSigPad(): void {
    if (!this.sigPadElement) return;
    const canvas = this.sigPadElement.nativeElement;
    if (!canvas) return;
    this.sigPad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
  }

  clearSignature(): void {
    this.sigPad?.clear();
  }

  switchToDrawMode(): void {
    this.signMode = 'draw';
    setTimeout(() => this.initSigPad(), 200);
  }

  confirmSignature(): void {
    if (!this.selectedContract) return;

    let signature = '';

    if (this.signMode === 'draw') {
      if (!this.sigPad || this.sigPad.isEmpty()) {
        alert("Veuillez dessiner votre signature.");
        return;
      }
      signature = this.sigPad.toDataURL();
    } else {
      if (!this.typedSignature.trim()) {
        alert("Veuillez saisir votre nom.");
        return;
      }
      signature = this.generateTypedSignature(this.typedSignature);
    }

    this.workspaceService.acceptContract(this.selectedContract.id, signature).subscribe({
      next: (res) => {
        this.selectedContract = res;
        this.showSignModal = false;
        this.loadData();
      },
      error: (err) => {
        console.error("Signature save error:", err);
        alert("Une erreur est survenue lors de la signature : " + (err.error?.message || err.message));
      }
    });
  }

  generateTypedSignature(name: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '40px "Caveat", cursive';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, canvas.width / 2, canvas.height / 2);
    }
    return canvas.toDataURL();
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text || !this.selectedRoom) return;
    this.newMessage = '';
    this.showEmojiPicker = false;
    this.workspaceService.sendMessage(this.selectedRoom.id, text).subscribe(res => {
      this.messages.push(res);
      this.lastMessageCount = this.messages.length;
      this.scrollToBottom();
    });
  }

  onInputChange(): void {
    this.isTyping = true;
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 2000);
  }

  addEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  fundEscrow(id: number): void {
    if (!this.selectedContract) return;
    this.stripeAmount = this.selectedContract.amount - (this.selectedContract.inEscrow || 0);
    this.stripeToken = '';
    this.stripeError = '';
    this.stripeSuccess = false;
    this.ccNumber = '';
    this.ccExpiry = '';
    this.ccCvc = '';
    this.showStripeModal = true;
  }

  processStripePayment(): void {
    if (!this.selectedContract) return;
    this.stripeProcessing = true;
    this.stripeError = '';
    
    // Simulate API delay with animation
    setTimeout(() => {
      this.workspaceService.simulateStripeFund(this.selectedContract!.id, this.stripeAmount, this.stripeToken).subscribe({
        next: (res) => {
          this.stripeSuccess = true; // Show success checkmark
          this.selectedContract = res;
          this.loadData();
          
          setTimeout(() => {
            this.showStripeModal = false;
            this.stripeProcessing = false;
            this.stripeSuccess = false;
          }, 2000); // Close modal after 2s
        },
        error: (err) => {
          this.stripeError = 'Paiement échoué. Vérifiez vos informations.';
          this.stripeProcessing = false;
        }
      });
    }, 2500); // Wait 2.5s to show processing state
  }

  closeStripeModal(): void {
    if (this.stripeProcessing) return;
    this.showStripeModal = false;
  }

  addMilestone(): void {
    if (!this.selectedContract) return;
    if (!this.newMilestone.title || this.newMilestone.amount <= 0) return;
    
    this.workspaceService.addMilestone(
      this.selectedContract.id,
      this.newMilestone.title,
      this.newMilestone.description,
      this.newMilestone.amount,
      this.newMilestone.dueDate || undefined
    ).subscribe({
      next: (m) => {
        if (!this.selectedContract!.milestones) {
          this.selectedContract!.milestones = [];
        }
        this.selectedContract!.milestones.push(m);
        // reset
        this.newMilestone = { title: '', description: '', amount: 0, dueDate: '' };
      },
      error: () => alert('Erreur lors de l\'ajout du milestone')
    });
  }

  releasePayment(id: number): void {
    this.workspaceService.releasePayment(id).subscribe(res => {
      this.selectedContract = res;
      this.loadData();
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = document.getElementById('fl-chat-box');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  goBack(): void {
    this.selectedContract = null;
    this.selectedRoom = null;
  }

  requestRevision(milestoneId: number): void {
    if (!confirm('Voulez-vous vraiment demander une révision pour ce milestone ?')) return;
    this.workspaceService.requestMilestoneRevision(milestoneId).subscribe({
      next: () => this.loadData(),
      error: () => alert('Erreur lors de la demande de révision.')
    });
  }

  isExportingPDF = false;

  exportPDF(): void {
    if (!this.selectedContract) return;
    this.isExportingPDF = true;
    
    // Allow UI to render the loading state
    setTimeout(() => {
      const element = document.getElementById('contract-pdf-content');
      if (!element) {
        this.isExportingPDF = false;
        return;
      }
      
      html2canvas(element, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Contrat_${this.selectedContract!.missionTitre.replace(/\s+/g, '_')}.pdf`);
        this.isExportingPDF = false;
      }).catch(() => {
        alert('Erreur lors de la génération du PDF.');
        this.isExportingPDF = false;
      });
    }, 100);
  }
}
