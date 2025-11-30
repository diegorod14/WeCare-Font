import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Nutricionista } from '../../model/nutricionista';
import { NutricionistaService } from '../../services/nutricionista-service';
import { Cita } from '../../model/cita';
import { CitaService } from '../../services/cita-service';
import { DialogComponent, CitaDialogData } from './dialog/dialog';

interface DialogResult extends CitaDialogData {
  usuarioId: number;
}

interface DiaAgenda {
  etiquetaDia: string;
  numeroDia: number;
  fecha: Date;
  seleccionado: boolean;
}

interface HoraAgenda {
  etiqueta: string;      // "9:00 am"
  seleccionado: boolean;
}

@Component({
  selector: 'app-nutricionista-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './nutricionista-info-component.html',
  styleUrls: ['./nutricionista-info-component.css']
})
export class NutricionistaInfoComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private nutricionistaService = inject(NutricionistaService);
  private citaService = inject(CitaService);
  private dialog = inject(MatDialog);

  nutricionista?: Nutricionista;

  diasAgenda: DiaAgenda[] = [];
  horasAgenda: HoraAgenda[] = [];

  private citasNutri: any[] = [];
  isSlotTaken = false;
  slotTakenMessage = '';
  private currentUserId: number | null = null;

  ngOnInit(): void {
    // Extraer el userId del token
    this.currentUserId = this.getUserIdFromToken();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.cargarNutricionista(id);
    }

    this.generarDiasAgenda();
    this.generarHorasAgenda();
  }

  // ----- Cargar nutricionista -----
  cargarNutricionista(id: number): void {
    this.nutricionistaService.listId(id).subscribe({
      next: (data: Nutricionista) => {
        this.nutricionista = data;
        // Cargar las citas del nutricionista para poder validar conflictos
        this.loadCitasNutricionista();
      },
      error: err => console.error('Error al cargar nutricionista', err)
    });
  }

  // Carga todas las citas y filtra las que pertenecen al nutricionista actual
  private loadCitasNutricionista(): void {
    if (!this.nutricionista) return;
    this.citaService.list().subscribe({
      next: (data: any[]) => {
        this.citasNutri = (data || []).filter(c => c.nutricionistaId === this.nutricionista?.id);
        this.checkSlotAvailability();
      },
      error: err => console.error('Error cargando citas', err)
    });
  }

  // ----- Agenda: días -----
  generarDiasAgenda(): void {
    const hoy = new Date();
    const nombresDias = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    this.diasAgenda = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      this.diasAgenda.push({
        etiquetaDia: nombresDias[fecha.getDay()],
        numeroDia: fecha.getDate(),
        fecha,
        seleccionado: i === 0 // por defecto el primer día
      });
    }
  }

  // ----- Agenda: horas -----
  generarHorasAgenda(): void {
    this.horasAgenda = [
      { etiqueta: '8:00 am', seleccionado: false },
      { etiqueta: '8:30 am', seleccionado: false },
      { etiqueta: '9:00 am', seleccionado: true },
      { etiqueta: '9:30 am', seleccionado: false },
      { etiqueta: '10:00 am', seleccionado: false },
      { etiqueta: '10:30 am', seleccionado: false },
      { etiqueta: '11:00 am', seleccionado: false },
      { etiqueta: '11:30 am', seleccionado: false }
    ];
  }

  seleccionarDia(dia: DiaAgenda): void {
    this.diasAgenda.forEach(d => d.seleccionado = false);
    dia.seleccionado = true;
    // Re-evaluar disponibilidad cuando cambia el día
    this.checkSlotAvailability();
  }

  seleccionarHora(hora: HoraAgenda): void {
    this.horasAgenda.forEach(h => h.seleccionado = false);
    hora.seleccionado = true;
    // Re-evaluar disponibilidad cuando cambia la hora
    this.checkSlotAvailability();
  }

  // Determina si el slot seleccionado (día+hora) ya tiene una cita
  // O si el usuario actual ya tiene una cita ese día con este nutricionista
  private checkSlotAvailability(): void {
    const diaSeleccionado = this.diasAgenda.find(d => d.seleccionado);
    const horaSeleccionada = this.horasAgenda.find(h => h.seleccionado);

    if (!diaSeleccionado || !horaSeleccionada || !this.nutricionista) {
      this.isSlotTaken = false;
      this.slotTakenMessage = '';
      return;
    }

    const fechaStr = this.formatFecha(diaSeleccionado.fecha);
    const horaStr = this.toHora24(horaSeleccionada.etiqueta);

    // PRIORIDAD 1: Verificar si el usuario actual ya tiene una cita ese día con este nutricionista
    // (sin importar la hora seleccionada)
    const usuarioTieneCitaEseDia = this.currentUserId
      ? this.citasNutri.some(c =>
          c.fecha === fechaStr &&
          c.usuarioId === this.currentUserId
        )
      : false;

    if (usuarioTieneCitaEseDia) {
      this.isSlotTaken = true;
      this.slotTakenMessage = 'Ya has reservado una cita en este día';
      return; // Terminar aquí, no verificar el slot específico
    }

    // PRIORIDAD 2: Verificar si el slot específico (nutricionista + fecha + hora) está ocupado
    const slotOcupado = this.citasNutri.some(c => c.fecha === fechaStr && c.hora === horaStr);

    if (slotOcupado) {
      this.isSlotTaken = true;
      this.slotTakenMessage = 'Este horario ya está ocupado';
    } else {
      this.isSlotTaken = false;
      this.slotTakenMessage = '';
    }
  }

  // ---------- helpers para armar Cita ----------

  private getUserIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload?.userId ?? null;
    } catch (error) {
      console.error('Error decodificando token', error);
      return null;
    }
  }

  private formatFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = ('0' + (fecha.getMonth() + 1)).slice(-2);
    const d = ('0' + fecha.getDate()).slice(-2);
    return `${y}-${m}-${d}`;               // 'YYYY-MM-DD'
  }

  private toHora24(label: string): string {
    // "9:00 am" -> "09:00"
    const [horaMin, ampmRaw] = label.split(' ');
    const [hStr, mStr] = horaMin.split(':');

    let h = Number(hStr);
    const ampm = (ampmRaw || '').toLowerCase();

    if (ampm === 'pm' && h !== 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;

    const hh = h.toString().padStart(2, '0');
    return `${hh}:${mStr}`; // "09:00", "14:30"
  }

  // ---------- Agendar cita ----------

  agendar(): void {
    if (this.isSlotTaken) {
      // Usar el mismo mensaje que ya está definido en slotTakenMessage
      alert(this.slotTakenMessage);
      return;
    }
    const diaSeleccionado = this.diasAgenda.find(d => d.seleccionado);
    const horaSeleccionada = this.horasAgenda.find(h => h.seleccionado);

    if (!diaSeleccionado || !horaSeleccionada) {
      alert('Selecciona un día y una hora.');
      return;
    }

    const fechaStr = this.formatFecha(diaSeleccionado.fecha);
    const horaStr = this.toHora24(horaSeleccionada.etiqueta);

    const dialogRef = this.dialog.open(DialogComponent, {
      width: '420px',
      data: {
        tipo_consulta: 'EVALUACION_INICIAL',
        estado: 'PROGRAMADA',
        motivo_consulta: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.crearCita(fechaStr, horaStr, result);
    });
  }

  private crearCita(fechaStr: string, horaStr: string, formValue: DialogResult): void {
     if (!this.nutricionista) {
       alert('Error: no se encontró el nutricionista.');
       return;
     }

     const usuarioId = formValue.usuarioId;
     if (!usuarioId) {
       alert('No se pudo obtener el usuario. Inicia sesión nuevamente.');
       return;
     }

     const citaPayload = {
       fecha: fechaStr,
       hora: horaStr,
       estado: formValue.estado,
       tipo_consulta: formValue.tipo_consulta,
       motivo_consulta: formValue.motivo_consulta,
       usuarioId,
       nutricionistaId: this.nutricionista.id
     } satisfies Omit<Cita, 'id'>;

     this.citaService.insert(citaPayload).subscribe({
       next: () => {
         alert('Tu cita ha sido agendada correctamente');
         // Actualizar cache y re-evaluar disponibilidad
         this.loadCitasNutricionista();
       },
       error: (err) => {
         console.error('Error al crear cita', err);
         alert('Ocurrió un error al agendar la cita');
       }
     });
   }
 }
