// angular import
import { Component } from '@angular/core';

// project import
import { ProfileComponent } from './profile/profile.component';
import { SocialFriendsComponent } from './social-friends/social-friends.component';
import { SocialFollowersComponent } from './social-followers/social-followers.component';
import { SocialGalleryComponent } from './social-gallery/social-gallery.component';
import { SocialFriendRequestComponent } from './social-friend-request/social-friend-request.component';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-social-profile',
  imports: [
    ...SHARED_IMPORTS,
    ProfileComponent,
    SocialFriendsComponent,
    SocialFollowersComponent,
    SocialGalleryComponent,
    SocialFriendRequestComponent
  ],
  templateUrl: './social-profile.component.html',
  styleUrl: './social-profile.component.scss'
})
export class SocialProfileComponent {
  // project Props
  dataValues: Array<object> = [];
}
