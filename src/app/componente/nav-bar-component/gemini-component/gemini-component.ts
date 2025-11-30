import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GeminiService } from '../../../services/gemini-service';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-gemini-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './gemini-component.html',
  styleUrl: './gemini-component.css',
})
export class GeminiComponent implements OnInit {
  private geminiService = inject(GeminiService);

  messages: Message[] = [];
  userMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadWelcomeMessage();
  }

  loadWelcomeMessage(): void {
    this.isLoading = true;
    this.geminiService.welcome().subscribe({
      next: (response: string) => {
        this.messages.push({
          content: response,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading welcome message:', error);
        this.messages.push({
          content: '¡Hola! Soy tu asistente virtual de MyCare. ¿En qué puedo ayudarte hoy?',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isLoading) return;

    // Agregar mensaje del usuario
    this.messages.push({
      content: this.userMessage,
      isUser: true,
      timestamp: new Date()
    });

    const messageToSend = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    // Enviar mensaje al backend
    this.geminiService.chat(messageToSend).subscribe({
      next: (response: string) => {
        this.messages.push({
          content: response,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.messages.push({
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
