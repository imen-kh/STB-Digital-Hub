import { Component, input } from '@angular/core';

@Component({
  selector: 'app-details',
  imports: [],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})
export class DetailsComponent {
  trash = input(true);

  // private Method
  itemList = [
    {
      name: 'Logo Design',
      dis: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: '6',
      amount: '$200',
      total: '$1200'
    },
    {
      name: 'Logo Design',
      dis: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: '7',
      amount: '$100',
      total: '$700'
    },
    {
      name: 'Logo Design',
      dis: 'lorem ipsum dolor sit amat, connecter adieu siccing eliot',
      quantity: '5',
      amount: '$150',
      total: '$750'
    }
  ];
}
