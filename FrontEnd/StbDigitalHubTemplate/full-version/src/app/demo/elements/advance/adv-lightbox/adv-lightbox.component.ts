// Angular import
import { Component, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third Party
import { Image, ModalGalleryService, ModalLibConfig } from '@ks89/angular-modal-gallery';

@Component({
  selector: 'app-adv-lightbox',
  imports: [...SHARED_IMPORTS],
  templateUrl: './adv-lightbox.component.html',
  styleUrl: './adv-lightbox.component.scss'
})
export class AdvLightboxComponent {
  private modalGalleryService = inject(ModalGalleryService);

  // private props
  imageIndex = 0;

  // private method
  openModal(id: number, imagesArrayToUse: Image[], imageIndex: number, libConfig?: ModalLibConfig): void {
    if (imagesArrayToUse.length === 0) {
      console.error('Cannot open modal-gallery because images array cannot be empty');
      return;
    }
    if (imageIndex > imagesArrayToUse.length - 1) {
      console.error('Cannot open modal-gallery because imageIndex must be valid');
      return;
    }
    const imageToShow: Image = imagesArrayToUse[imageIndex];
    this.modalGalleryService.open({
      id,
      images: imagesArrayToUse,
      currentImage: imageToShow,
      libConfig
    });
  }

  images: Image[] = [
    new Image(0, {
      img: 'assets/images/light-box/sl3.jpg',
      extUrl: 'http://www.google.com'
    }),
    new Image(1, {
      img: 'assets/images/light-box/sl4.jpg',
      description: 'Description 2'
    }),
    new Image(2, {
      img: 'assets/images/light-box/sl5.jpg',
      description: 'Description 3'
    }),
    new Image(3, {
      img: 'assets/images/light-box/sl6.jpg',
      description: 'Description 4'
    })
  ];

  Images = [
    {
      src: 'assets/images/light-box/sl3.jpg'
    },
    {
      src: 'assets/images/light-box/sl4.jpg'
    },
    {
      src: 'assets/images/light-box/sl5.jpg'
    },
    {
      src: 'assets/images/light-box/sl6.jpg'
    }
  ];
}
