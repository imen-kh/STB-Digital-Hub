// angular import
import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { CardOffcanvasComponent } from './card-offcanvas/card-offcanvas.component';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';
import contactList from 'src/fake-data/contact-list.json';
import { BerryDefaultConfig } from 'src/app/app-config';

// Bootstrap
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
  selector: 'app-cards',
  imports: [CommonModule, ...SHARED_IMPORTS, CardOffcanvasComponent, PlaceholderCard1Component, ScrollbarComponent],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss'
})
export class CardsComponent implements OnInit {
  private offcanvasService = inject(NgbOffcanvas);

  // public props
  searchTerm: string = '';
  boxLayout!: boolean;

  // life cycle hook
  ngOnInit() {
    this.boxLayout = BerryDefaultConfig.isBox_container;
  }

  // Public methods
  addContact(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  // Private methods
  Contact: contactList[] = contactList;

  filterFriends(searchTerm: string): void {
    this.Contact = contactList.filter(
      (list) =>
        list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.ContactList.some(
          (details) =>
            details.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details.location.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }
}
