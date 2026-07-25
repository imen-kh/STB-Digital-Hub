import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { ConfigurationComponent } from '../admin/configuration/configuration.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

@Component({
  selector: 'app-guest',
  imports: [ConfigurationComponent, RouterModule],
  templateUrl: './guest.component.html',
  styleUrl: './guest.component.scss'
})
export class GuestComponent implements OnInit {
  private configService = inject(ConfigService);

  // public props
  presetColor!: string;

  // Life cycle events
  ngOnInit(): void {
    this.presetColor = this.configService.theme_color();
  }
}
