// Angular import
import { Component } from '@angular/core';

// project Import
import listStyleData from 'src/fake-data/list-style-1.json';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

interface person {
  number: string;
  src: string;
  name: string;
  email: string;
  country: string;
  friend: string;
  follower: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-list-style-v1',
  imports: [...SHARED_IMPORTS],
  templateUrl: './list-style-v1.component.html',
  styleUrl: './list-style-v1.component.scss'
})
export class ListStyleV1Component {
  // public props
  searchTerm = '';
  PersonList: person[] = listStyleData;

  // public method
  filterFriends(searchTerm: string): void {
    this.PersonList = listStyleData.filter(
      (user) =>
        user.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.friend.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.follower.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
