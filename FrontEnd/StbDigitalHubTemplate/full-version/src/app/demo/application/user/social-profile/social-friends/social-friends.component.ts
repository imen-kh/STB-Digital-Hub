// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import friendData from 'src/fake-data/friend-list.json';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface friends {
  src: string;
  name: string;
  location: string;
}

@Component({
  selector: 'app-social-friends',
  imports: [...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './social-friends.component.html',
  styleUrl: './social-friends.component.scss'
})
export class SocialFriendsComponent {
  // public props
  searchTerm = '';
  friendList: friends[] = friendData;

  filterFriends(searchTerm: string): void {
    this.friendList = friendData.filter(
      (friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) || friend.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
