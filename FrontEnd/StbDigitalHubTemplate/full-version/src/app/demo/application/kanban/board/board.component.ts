// angular import
import { Component } from '@angular/core';

// Third Party
import { DragulaModule, DragulaService } from 'ng2-dragula';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-board',
  imports: [DragulaModule, ...SHARED_IMPORTS],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss', '../../../../../../node_modules/dragula/dist/dragula.css'],
  providers: [DragulaService]
})
export class BoardComponent {
  // private Method
  boardList = [
    {
      header: 'Online fees payment',
      des: ' User Story #9428',
      img: 'assets/images/application/profile-back-1.png'
    },
    {
      header: 'Set allowing rules for trusted applications.',
      des: 'User Story #7993',
      img: 'assets/images/application/profile-back-2.png'
    },
    {
      header: 'Managing Applications Launch Control',
      des: 'User Story #9172',
      img: 'assets/images/application/profile-back-3.png'
    },
    {
      header: 'Purchase Requisitions, Adjustments, and Transfers.',
      des: 'User Story #2534',
      img: 'assets/images/application/profile-back-4.png'
    }
  ];

  newList = [
    {
      title: 'Update React & TypeScript version',
      text: 'User Story #9028'
    },
    {
      title: 'Inventory Implementation & Design',
      text: 'User Story #9035.'
    },
    {
      title: 'Set allowing rules for trusted applications.',
      text: ' User Story #7993.'
    },
    {
      title: 'Managing Applications Launch Control',
      text: ' User Story #9172.'
    },
    {
      title: 'Inventory Implementation & Design',
      text: 'User Story #9035.'
    },
    {
      title: 'Set allowing rules for trusted applications.',
      text: ' User Story #7993.'
    },
    {
      title: 'Managing Applications Launch Control',
      text: ' User Story #9172.'
    }
  ];

  progressList = [
    {
      title: 'Creation and Maintenance of Inventory Objects',
      text: 'User Story #2434.'
    },
    {
      title: 'Theme migration from v4 to v5',
      text: 'User Story #2536.'
    },
    {
      title: 'Update React & TypeScript version',
      text: 'User Story #9645.'
    },
    {
      title: 'Run codemods',
      text: 'User Story #9645.'
    },
    {
      title: 'Handling breaking changes',
      text: 'User Story #2486.'
    },
    {
      title: 'Theme migration from v4 to v5',
      text: 'User Story #2536.'
    },
    {
      title: 'Update React & TypeScript version',
      text: 'User Story #9645.'
    },
    {
      title: 'Run codemods',
      text: 'User Story #9645.'
    },
    {
      title: 'Handling breaking changes',
      text: 'User Story #2486.'
    }
  ];

  reviewList = [
    {
      title: 'Creation and Maintenance of Inventory Objects',
      text: 'User Story #2434.'
    },
    {
      title: 'Theme migration from v4 to v5',
      text: 'User Story #2536.'
    },
    {
      title: 'Update React & TypeScript version',
      text: 'User Story #9645.'
    },
    {
      title: 'Run codemods',
      text: 'User Story #9645.'
    },
    {
      title: 'Handling breaking changes',
      text: 'User Story #2486.'
    },
    {
      title: 'Update React & TypeScript version',
      text: 'User Story #9645.'
    },
    {
      title: 'Run codemods',
      text: 'User Story #9645.'
    },
    {
      title: 'Handling breaking changes',
      text: 'User Story #2486.'
    }
  ];

  doneList = [
    {
      title: 'Lunch Beauty Application',
      text: 'User Story #3056.'
    },
    {
      title: 'Set allowing rules for trusted applications',
      text: 'User Story #2666.'
    },
    {
      title: 'Managing Applications Launch Control',
      text: 'User Story #2476.'
    },
    {
      title: 'Graphical fixes',
      text: 'User Story #2958.'
    },
    {
      title: 'Email alerts',
      text: 'User Story #2986.'
    },
    {
      title: 'Graphical fixes',
      text: 'User Story #2958.'
    },
    {
      title: 'Email alerts',
      text: 'User Story #2986.'
    }
  ];
}
