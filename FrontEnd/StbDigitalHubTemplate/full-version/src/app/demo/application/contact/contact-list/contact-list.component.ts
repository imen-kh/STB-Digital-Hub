// Angular Import
import { Component, TemplateRef, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import contactList from 'src/fake-data/contact-list.json';

// third party
import { TagInputModule } from 'ngx-chips';

// Bootstrap imports
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

interface contactList {
  title: string;
  hide: boolean;
  ContactList: contactDetails[];
}
interface contactDetails {
  src: string;
  name: string;
  position: string;
  email: string;
  number: string;
  location: string;
}

@Component({
  selector: 'app-contact-list',
  imports: [...SHARED_IMPORTS, TagInputModule],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss'
})
export class ContactListComponent {
  private offcanvasService = inject(NgbOffcanvas);

  // Private props
  closeResult = 'string';

  contactUser: contactList[] = contactList;

  // Private methods
  contactDetail(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  editContactDetail(content1: TemplateRef<string>) {
    this.offcanvasService.open(content1, { position: 'end' });
  }

  addList = [
    {
      name: 'Name',
      icon: 'account_circle',
      placeholder: 'Enter Name'
    },
    {
      name: 'Company',
      icon: 'business',
      placeholder: 'Enter Company'
    },
    {
      name: 'Job Title',
      icon: 'work',
      placeholder: 'Enter Job Title'
    },
    {
      name: 'Email',
      icon: 'email',
      placeholder: 'Enter Email'
    },
    {
      name: 'Phone Number',
      icon: 'call',
      placeholder: 'Enter Phone Number'
    }
  ];

  taskList = [
    {
      name: 'business',
      describe: 'ABC Pvt Ltd'
    },
    {
      name: 'work',
      describe: 'Sr. Customer Manager'
    },
    {
      name: 'email',
      describe: 'alene_work@company.com',
      office: 'Work',
      email: 'alene@company.com',
      personal: 'Personal'
    },
    {
      name: 'call',
      describe: '380-293-0177',
      office: 'Work',
      email: '380-293-0177',
      personal: 'Personal'
    },
    {
      name: 'pin_drop',
      describe: 'Port Narcos'
    },
    {
      name: 'cake',
      describe: 'November 30, 1997'
    },
    {
      name: 'info',
      describe: 'Happy Birthday Alene'
    }
  ];
}
