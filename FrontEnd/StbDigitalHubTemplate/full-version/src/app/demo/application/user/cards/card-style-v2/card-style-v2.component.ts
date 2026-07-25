// Angular import
import { Component } from '@angular/core';

// project Import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import socialFriend from 'src/fake-data/social-friends.json';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface friend {
  src: string;
  name: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-card-style-v2',
  imports: [...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './card-style-v2.component.html',
  styleUrl: './card-style-v2.component.scss'
})
export class CardStyleV2Component {
  // private props
  searchTerm = '';
  socialFriendsList: friend[] = socialFriend;

  // public method
  filterFriends(searchTerm: string): void {
    this.socialFriendsList = socialFriend.filter(
      (user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
