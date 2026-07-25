import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// rxjs library
import { Subscription } from 'rxjs';

// third Party
import { QuillModule } from 'ngx-quill';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

// project import
import { EmailDetailsComponent } from './email-details/email-details.component';
import { EmailService } from './email.service';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

@Component({
  selector: 'app-email',
  imports: [CommonModule, ...SHARED_IMPORTS, QuillModule, EmailDetailsComponent, ScrollbarComponent],
  templateUrl: './email.component.html',
  styleUrl: './email.component.scss'
})
export class EmailComponent implements OnInit, OnDestroy {
  private modalService = inject(NgbModal);
  private emailService = inject(EmailService);
  private offcanvasService = inject(NgbOffcanvas);

  // private props
  closeResult = '';
  isCollapsed = true;
  isCollapsed1 = false;
  mailListHight!: boolean;
  starListMail!: boolean;
  emailDetails!: boolean;
  emailSub: Subscription = new Subscription();

  ngOnInit() {
    this.emailSub = this.emailService.fadeIn$.subscribe((value) => {
      this.emailDetails = value;
    });
  }

  ngOnDestroy() {
    this.emailSub.unsubscribe();
  }

  // private Method
  OpenCompose(content: ElementRef) {
    this.modalService.open(content, { centered: true });
  }

  openMainMenu(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'start' });
  }
}
