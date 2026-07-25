// Angular import
import { Component, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-clipboard',
  imports: [...SHARED_IMPORTS, ClipboardModule],
  templateUrl: './clipboard.component.html',
  styleUrl: './clipboard.component.scss'
})
export class ClipboardComponent implements OnInit, OnDestroy {
  private _clipboardService = inject(ClipboardService);

  // private props
  text1!: string;
  text2!: string;
  textModal!: string;
  isCopied1!: boolean;
  isCopied2!: boolean;
  isCopied3!: boolean;
  basic = false;
  clipSub = new Subscription();
  private modalService = inject(NgbModal);

  // Life cycle events
  ngOnInit(): void {
    this.clipSub = this._clipboardService.copyResponse$.subscribe((re) => {
      if (re.isSuccess) {
        alert('copy success!');
      }
    });
  }

  ngOnDestroy() {
    this.clipSub.unsubscribe();
  }

  // private method
  callServiceToCopy() {
    this._clipboardService.copy('This is copy thru service copyFromContent directly');
  }

  onCopyFailure() {
    alert('copy fail!');
  }

  openFocusTrap(content: TemplateRef<unknown>) {
    this.modalService.open(content, { centered: true });
  }
}
