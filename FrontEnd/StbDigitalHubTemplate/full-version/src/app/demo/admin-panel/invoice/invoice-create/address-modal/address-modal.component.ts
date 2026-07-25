// angular import
import { Component, inject } from '@angular/core';

// bootstrap import
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-address-modal',
  imports: [...SHARED_IMPORTS],
  templateUrl: './address-modal.component.html',
  styleUrl: './address-modal.component.scss'
})
export class AddressModalComponent {
  activeModal = inject(NgbActiveModal);

  // public props
  isCollapsed = false;
  multiCollapsed = true;

  // public method
  close() {
    this.activeModal.close('Send data');
  }

  selectAddress(index: number) {
    this.addressList.forEach((item, i) => (item.checked = i === index));
  }

  addressList = [
    {
      checked: true,
      name: 'Ian Carpenter',
      address: '1754 Ureate Path, 695 Newga View, Seporcus, Rhode Island, Belgium - SA5 5BO',
      phone: '+91 1234567890'
    },
    {
      checked: false,
      name: 'Ian Carpenter',
      address: '1754 Ureate Path, 695 Newga View, Seporcus, Rhode Island, Belgium - SA5 5BO',
      phone: '+91 1234567890'
    },
    {
      checked: false,
      name: 'Ian Carpenter',
      address: '1754 Ureate Path, 695 Newga View, Seporcus, Rhode Island, Belgium - SA5 5BO',
      phone: '+91 1234567890'
    }
  ];

  inputList = [
    {
      label: 'First Name :',
      subTitle: 'Enter your first name',
      type: 'text'
    },
    {
      label: 'Last Name :',
      subTitle: 'Enter your last name',
      type: 'text'
    },
    {
      label: 'Email Id :',
      subTitle: 'Enter Email id',
      type: 'email'
    },
    {
      label: 'Date of Birth :',
      subTitle: 'Enter the date of birth',
      type: 'date'
    },
    {
      label: 'Phone number :',
      subTitle: 'Enter Phone number',
      type: 'number'
    },
    {
      label: 'City :',
      subTitle: 'Enter City name',
      type: 'text'
    }
  ];
}
