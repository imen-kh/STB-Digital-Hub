// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import imageData from 'src/fake-data/card-image.json';
import { PlaceholderCard1Component } from 'src/app/theme/shared/components/placeholder-card/placeholder-1.component';

interface images {
  src: string;
}

@Component({
  selector: 'app-social-gallery',
  imports: [...SHARED_IMPORTS, PlaceholderCard1Component],
  templateUrl: './social-gallery.component.html',
  styleUrl: './social-gallery.component.scss'
})
export class SocialGalleryComponent {
  // public props
  imageList: images[] = imageData;
}
