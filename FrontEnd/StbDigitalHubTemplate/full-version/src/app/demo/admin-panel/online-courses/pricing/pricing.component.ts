// angular import
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

export interface PricingPlan {
  title: string;
  type: string;
  price: number;
  checked: boolean;
  imageSrc: string;
  items: string[];
}

@Component({
  selector: 'app-pricing',
  imports: [...SHARED_IMPORTS],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingComponent {
  // public props
  selectedImage = signal<string>('assets/images/admin/price-regular.svg');
  selectedPackageIndex = signal<number>(1);

  // public method
  priceList: PricingPlan[] = [
    {
      title: 'FREE',
      type: 'Basic Features',
      price: 0,
      checked: false,
      imageSrc: 'assets/images/admin/price-free.svg',
      items: ['One End Product', 'No attribution required', 'TypeScript']
    },
    {
      title: 'REGULAR',
      type: 'Trending',
      price: 99,
      checked: true,
      imageSrc: 'assets/images/admin/price-regular.svg',
      items: ['One End Product', 'No attribution required', 'TypeScript', 'Figma Design Resources', 'Create Multiple Products']
    },
    {
      title: 'PRO',
      type: 'For advanced',
      price: 199,
      checked: false,
      imageSrc: 'assets/images/admin/price-pro.svg',
      items: [
        'One End Product',
        'No attribution required',
        'TypeScript',
        'Figma Design Resources',
        'Create Multiple Products',
        'Create a SaaS Project'
      ]
    },
    {
      title: 'Business',
      type: 'For advanced',
      price: 299,
      checked: false,
      imageSrc: 'assets/images/admin/price-business.svg',
      items: [
        'One End Product',
        'No attribution required',
        'TypeScript',
        'Figma Design Resources',
        'Create Multiple Products',
        'Create a SaaS Project',
        'Resale Product',
        'Separate sale of our UI Elements?'
      ]
    }
  ];

  onRadioChange(imageSrc: string) {
    this.selectedImage.set(imageSrc);
  }

  selectPackage(index: number): void {
    this.selectedPackageIndex.set(index);
  }
}
