import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FreelanceMilestone {
  id: number;
  contractId: number;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'APPROVED' | 'PAID' | 'REVISION';
  createdAt: string;
}

export interface FreelanceContract {
  id: number;
  missionId: number;
  missionTitre: string;
  clientId: number;
  clientNom: string;
  freelancerId: number;
  freelancerNom: string;
  amount: number;
  terms: string;
  status: 'PROPOSED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  totalPaid: number;
  inEscrow: number;
  
  smartContractHash?: string;
  clientAccepted?: boolean;
  freelancerAccepted?: boolean;
  clientSignature?: string;
  freelancerSignature?: string;
  totalEscrow?: number;
  milestones?: FreelanceMilestone[];
}

export interface FreelanceChatRoom {
  id: number;
  missionId?: number;
  missionTitre?: string;
  clientId: number;
  clientNom: string;
  freelancerId: number;
  freelancerNom: string;
  updatedAt: string;
}

export interface FreelanceChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderNom: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FreelanceWorkspaceService {
  private BASE = `${environment.apiUrl}/freelance/workspace`;

  constructor(private http: HttpClient) {}

  // ================= Chat API =================
  getMyRooms(): Observable<FreelanceChatRoom[]> {
    return this.http.get<FreelanceChatRoom[]>(`${this.BASE}/rooms`);
  }

  getOrCreateRoom(missionId: number, freelancerId: number): Observable<FreelanceChatRoom> {
    return this.http.post<FreelanceChatRoom>(`${this.BASE}/rooms/get-or-create`, { missionId, freelancerId });
  }

  getRoomMessages(roomId: number): Observable<FreelanceChatMessage[]> {
    return this.http.get<FreelanceChatMessage[]>(`${this.BASE}/rooms/${roomId}/messages`);
  }

  sendMessage(roomId: number, content: string): Observable<FreelanceChatMessage> {
    return this.http.post<FreelanceChatMessage>(`${this.BASE}/rooms/${roomId}/messages`, { content });
  }

  // ================= Contracts API =================
  getMyContracts(): Observable<FreelanceContract[]> {
    return this.http.get<FreelanceContract[]>(`${this.BASE}/contracts`);
  }

  proposeContract(missionId: number, freelancerId: number, amount: number, terms: string): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/propose`, { missionId, freelancerId, amount, terms });
  }

  acceptContract(contractId: number, signature: string): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/${contractId}/accept`, { signature });
  }

  fundEscrow(contractId: number, amount: number): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/${contractId}/fund`, { amount });
  }

  releasePayment(contractId: number): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/${contractId}/release`, {});
  }

  generateContract(missionId: number, freelancerId: number, amount: number): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/generate`, { missionId, freelancerId, amount });
  }

  addMilestone(contractId: number, title: string, description: string, amount: number, dueDate?: string): Observable<FreelanceMilestone> {
    return this.http.post<FreelanceMilestone>(`${this.BASE}/contracts/${contractId}/milestones`, { title, description, amount, dueDate });
  }

  simulateStripeFund(contractId: number, amount: number, stripeToken: string): Observable<FreelanceContract> {
    return this.http.post<FreelanceContract>(`${this.BASE}/contracts/${contractId}/stripe-fund`, { amount, stripeToken });
  }

  requestMilestoneRevision(milestoneId: number): Observable<FreelanceMilestone> {
    return this.http.post<FreelanceMilestone>(`${this.BASE}/milestones/${milestoneId}/revision`, {});
  }
}
