// Angular import
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import cardData from 'src/fake-data/card.json';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface cards {
  src: string;
  name: string;
  position: string;
  text: string;
  email: string;
  phone: string;
  location: string;
}

@Component({
  selector: 'app-card-style-v1',
  imports: [CommonModule, ...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './card-style-v1.component.html',
  styleUrl: './card-style-v1.component.scss'
})
export class CardStyleV1Component implements OnInit {
  // private Props
  searchTerm = '';
  cardList: cards[] = cardData;
  boxLayout!: boolean;

  // life cycle hook
  ngOnInit() {
    this.boxLayout = BerryDefaultConfig.isBox_container;
  }

  // public method
  filterFriends(searchTerm: string): void {
    this.cardList = cardData.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
