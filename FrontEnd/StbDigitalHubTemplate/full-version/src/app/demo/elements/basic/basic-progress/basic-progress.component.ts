// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-progress',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-progress.component.html',
  styleUrl: './basic-progress.component.scss'
})
export class BasicProgressComponent {
  height = '20px';
}
