// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import requestData from 'src/fake-data/friends-request-list.json';

// third Party
import { SweetAlert2LoaderService } from '@sweetalert2/ngx-sweetalert2';
import { FormsModule } from '@angular/forms';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface friendRequests {
  src: string;
  name: string;
  mFriend: string;
}

@Component({
  selector: 'app-social-friend-request',
  imports: [...SHARED_IMPORTS, FormsModule, PlaceholderCard1Component],
  templateUrl: './social-friend-request.component.html',
  styleUrl: './social-friend-request.component.scss',
  providers: [SweetAlert2LoaderService]
})
export class SocialFriendRequestComponent {
  searchTerm: string = '';
  // project Props
  friendRequest: friendRequests[] = requestData;

  filterFriends(searchTerm: string): void {
    this.friendRequest = requestData.filter(
      (friend) =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) || friend.mFriend.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
