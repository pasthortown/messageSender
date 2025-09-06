import { Component } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-new-event',
  imports: [NgSelectModule, NgbDatepickerModule, NgbTimepickerModule],
  templateUrl: './new-event.component.html',
  styleUrl: './new-event.component.scss'
})
export class NewEventComponent {

}
