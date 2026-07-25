// Angular import
import { Component } from '@angular/core';

// project Import
import blogData from 'src/fake-data/blog-card.json';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface cardList {
  src: string;
  img: string;
  description: string;
  name: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-card-style-v3',
  imports: [...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './card-style-v3.component.html',
  styleUrl: './card-style-v3.component.scss'
})
export class CardStyleV3Component {
  // public Props
  searchTerm = '';
  ImgCardList: cardList[] = blogData;

  // public method
  filterFriends(searchTerm: string): void {
    this.ImgCardList = blogData.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
