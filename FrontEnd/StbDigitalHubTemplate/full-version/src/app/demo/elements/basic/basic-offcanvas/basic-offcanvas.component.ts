import { Component, ElementRef, TemplateRef, inject } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-offcanvas',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-offcanvas.component.html',
  styleUrl: './basic-offcanvas.component.scss'
})
export class BasicOffcanvasComponent {
  private offcanvasService = inject(NgbOffcanvas);

  // private props
  closeResult = 'string';

  // private method
  open(content: ElementRef) {
    this.offcanvasService.open(content, { ariaLabelledBy: 'offcanvas-basic-title' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: OffcanvasDismissReasons): string {
    if (reason === OffcanvasDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === OffcanvasDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on the backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openTop(content1: TemplateRef<string>) {
    this.offcanvasService.open(content1, { position: 'top' });
  }

  openEnd(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  openBottom(content1: TemplateRef<string>) {
    this.offcanvasService.open(content1, { position: 'bottom' });
  }

  openScroll(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { scroll: true });
  }

  openBackdrop(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { backdrop: true });
  }

  openBothOptions(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { backdrop: true, scroll: true });
  }
}
