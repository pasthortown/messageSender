import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

// UI
import { NewEventComponent, NewEventPayload } from './new-event/new-event.component';
import { ScheduleComponent } from './../../../components/schedule/schedule.component';

// Servicio
import { CatalogService } from './../../services/catalog.service';

// Tipos EXACTOS que usa new-event y los listados
export interface Message {
  item_id: number;
  description: string;
  [key: string]: any;
}

export interface UsersGroup {
  item_id: number;
  group: string;
  [key: string]: any;
}

// --- Agenda normalizada ---
export interface AgendaItem {
  item_id: number;
  message_id: number;
  group: string;
  scheduleISO: string;      // schedule.$date en ISO
  timestampISO?: string;    // timestamp.$date en ISO
  [key: string]: any;       // por si backend manda extras
}

// ---- helpers de parseo ----
function mongoDateToISO(md?: any): string | undefined {
  return md?.$date ? new Date(md.$date).toISOString() : undefined;
}
function oidToString(oid: any): string {
  return oid?.$oid ?? '';
}

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, NewEventComponent, ScheduleComponent],
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {

  // --- estado de UI ---
  lastEvent: NewEventPayload | null = null;

  // --- datos remotos para el formulario ---
  messages: Message[] = [];
  groups: UsersGroup[] = [];

  // --- agenda (messagesgroup) ---
  agenda: AgendaItem[] = [];

  // --- flags de carga ---
  loadingMessages = false;
  loadingGroups = false;
  loadingAgenda = false;

  constructor(private catalogService: CatalogService) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.getMessages(),
      this.getGroups(),
      this.getAgenda(),
    ]);
  }

  onCreateEvent(ev: NewEventPayload): void {
    this.lastEvent = ev;
    console.log('[SCHEDULER] Evento recibido desde <app-new-event>:', ev);

    // === Generar un AgendaItem POR CADA GRUPO seleccionado (solo log, no insertamos) ===
    if (!ev.messageKey || !ev.scheduledAtISO || !ev.groups?.length) {
      console.warn('[SCHEDULER] Datos insuficientes para generar AgendaItem(s).');
      return;
    }

    const nowISO = new Date().toISOString();
    const items: AgendaItem[] = ev.groups.map((g) => ({
      item_id: ev.messageKey!,
      message_id: ev.messageKey!,     // backend usa message_id
      group: g,
      scheduleISO: ev.scheduledAtISO!,
      timestampISO: nowISO
    }));
  }

  // ===== llamadas al web service =====
  async getMessages(): Promise<void> {
    this.loadingMessages = true;
    try {
      const { response } = await this.catalogService.list<Message>('messages');
      this.messages = response ?? [];
    } catch (err) {
      console.error('Error cargando Messages:', err);
      this.messages = [];
    } finally {
      this.loadingMessages = false;
    }
  }

  async getGroups(): Promise<void> {
    this.loadingGroups = true;
    try {
      const { response } = await this.catalogService.list<UsersGroup>('usersgroup');
      this.groups = response ?? [];
    } catch (err) {
      console.error('Error cargando Groups (usersgroup):', err);
      this.groups = [];
    } finally {
      this.loadingGroups = false;
    }
  }

  async getAgenda(): Promise<void> {
    this.loadingAgenda = true;
    try {
      const { response } = await this.catalogService.list<any>('messagesgroup');
      this.agenda = (response ?? []).map((d: any) => ({
        _id: oidToString(d._id),
        item_id: d.item_id,
        message_id: d.message_id,
        group: d.group,
        scheduleISO: mongoDateToISO(d.schedule)!,
        timestampISO: mongoDateToISO(d.timestamp),
      }));
    } catch (err) {
      console.error('Error cargando Agenda (messagesgroup):', err);
      this.agenda = [];
    } finally {
      this.loadingAgenda = false;
    }
  }
}
