// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// Third party
import { TagInputModule } from 'ngx-chips';

@Component({
  selector: 'app-card-offcanvas',
  imports: [CommonModule, ...SHARED_IMPORTS, TagInputModule],
  templateUrl: './card-offcanvas.component.html',
  styleUrl: './card-offcanvas.component.scss'
})
export class CardOffcanvasComponent {}
