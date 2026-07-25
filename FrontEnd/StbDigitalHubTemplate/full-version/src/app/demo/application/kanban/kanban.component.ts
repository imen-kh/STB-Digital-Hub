// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BacklogComponent } from './backlog/backlog.component';
import { BoardComponent } from './board/board.component';

@Component({
  selector: 'app-kanban',
  imports: [...SHARED_IMPORTS, BacklogComponent, BoardComponent],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss'
})
export class KanbanComponent {}
