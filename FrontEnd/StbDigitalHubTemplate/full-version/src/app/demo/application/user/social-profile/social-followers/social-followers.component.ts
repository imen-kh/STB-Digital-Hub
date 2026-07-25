// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import followerData from 'src/fake-data/follower-list.json';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface followers {
  src: string;
  name: string;
  location: string;
  status: string;
}

@Component({
  selector: 'app-social-followers',
  imports: [...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './social-followers.component.html',
  styleUrl: './social-followers.component.scss'
})
export class SocialFollowersComponent {
  // public props
  searchTerm = '';
  followerList: followers[] = followerData;

  filterFriends(searchTerm: string): void {
    this.followerList = followerData.filter(
      (friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) || friend.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
