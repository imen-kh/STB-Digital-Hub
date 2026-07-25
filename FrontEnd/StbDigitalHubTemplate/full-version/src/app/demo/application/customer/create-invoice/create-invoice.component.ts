// Angular import
import { Component, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// Bootstrap import
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

interface invoiceList {
  id: number;
  title: string;
  description: string;
  quantity: number;
  amount: number;
  total: number;
}

@Component({
  selector: 'app-create-invoice',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './create-invoice.component.html',
  styleUrl: './create-invoice.component.scss'
})
export class CreateInvoiceComponent {
  private modalService = inject(NgbModal);

  // private props
  closeResult = '';
  itemTitle!: string;
  itemDescription!: string;
  itemQuantity!: number;
  itemAmount!: number;
  itemTotal!: number;
  todo_list_message_error!: boolean;

  // public method
  invoice: invoiceList[] = [
    {
      id: 1,
      title: 'Logo Design',
      description: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: 2,
      amount: 25,
      total: 50
    },
    {
      id: 2,
      title: 'Theme Design',
      description: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: 4,
      amount: 50,
      total: 200
    },
    {
      id: 3,
      title: 'Landing Design',
      description: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: 4,
      amount: 75,
      total: 300
    }
  ];

  // public method
  addItem() {
    if (
      (this.itemTitle === '' || this.itemTitle === undefined,
      this.itemDescription === '' || this.itemDescription === undefined,
      this.itemQuantity === undefined,
      this.itemAmount === undefined,
      this.itemTotal === undefined)
    ) {
      this.todo_list_message_error = true;
    } else {
      this.todo_list_message_error = false;
      const newItem: invoiceList = {
        id: this.invoice.length + 1,
        title: this.itemTitle,
        description: this.itemDescription,
        quantity: this.itemQuantity,
        amount: this.itemAmount,
        total: this.itemTotal
      };
      this.invoice.push(newItem);
      this.itemTitle = '';
      this.itemDescription = '';
      this.itemQuantity = NaN;
      this.itemAmount = NaN;
      this.itemTotal = NaN;
    }
  }

  deleteTask(taskId: number) {
    this.invoice = this.invoice.filter((invoice) => invoice.id !== taskId);
  }

  OpenBootstrap(content17: ElementRef) {
    this.modalService.open(content17, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: ModalDismissReasons): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  printPage() {
    const link2 = document.createElement('link');
    link2.innerHTML =
      '<style>@media print{*,::after,::before{text-shadow:none!important;box-shadow:none!important}a:not(.btn){text-decoration:none}abbr[title]::after{content:" ("attr(title) ")"}pre{white-space:pre-wrap!important}blockquote,pre{border:1px solid #adb5bd;page-break-inside:avoid}thead{display:table-header-group}img,tr{page-break-inside:avoid}h2,h3,p{orphans:3;widows:3}h2,h3{page-break-after:avoid}@page{size:a3}body{min-width:992px!important}.container{min-width:992px!important}.page-header,.coded-navbar,.coded-mob-header,.coded-header,.menu-styler,.modal,.navbar{display:none}.coded-main-container{top:0;margin-left:0;}.invoice-contact{padding-top:0;}@page,.card-body,.card-header,body,.coded-content{padding:0;margin:0}.badge{border:1px solid #000}.table{border-collapse:collapse!important}.table td,.table th{background-color:#fff!important}.table-bordered td,.table-bordered th{border:1px solid #dee2e6!important}.table-dark{color:inherit}.table-dark tbody+tbody,.table-dark td,.table-dark th,.table-dark thead th{border-color:#dee2e6}.table .thead-dark th{color:inherit;border-color:#dee2e6}}</style>';

    document.getElementsByTagName('head')[0].appendChild(link2);
    window.print();
  }

  details = [
    {
      title: 'Customer Name',
      value: 'Alex Z.'
    },
    {
      title: 'Customer Email',
      value: 'alex@company.com'
    },
    {
      title: 'Customer Contact Number',
      value: '+ 00 00000 00000'
    }
  ];

  total = [
    {
      title: 'Sub Total :',
      text: '$4725.00'
    },
    {
      title: 'Taxes (10%) :',
      text: '$57.00'
    },
    {
      title: 'Discount (5%) :',
      text: '$45.00'
    }
  ];
}
