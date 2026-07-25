// angular import
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

type PricingType = 'basic' | 'popular' | 'premium';

interface PricingFeature {
  readonly available: boolean;
  readonly title: string;
}
interface PricingPlan {
  type: PricingType;
  title: string;
  serviceCount: number;
  yearly: number;
  monthly: number;
  features: readonly PricingFeature[];
}

@Component({
  selector: 'app-setting-pricing',
  imports: [...SHARED_IMPORTS],
  templateUrl: './setting-pricing.component.html',
  styleUrl: './setting-pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingPricingComponent {
  // public props
  billingCycle = signal<'monthly' | 'yearly'>('monthly');

  // public methods
  setActiveButton(button: 'monthly' | 'yearly'): void {
    this.billingCycle.set(button);
  }

  isMonthly = computed(() => this.billingCycle() === 'monthly');

  pricingPlans: PricingPlan[] = [
    {
      type: 'basic',
      title: 'Basic',
      serviceCount: 3,
      yearly: 269,
      monthly: 69,
      features: [
        {
          available: true,
          title: 'One End Product'
        },
        {
          available: true,
          title: 'No attribution required'
        },
        {
          available: true,
          title: 'TypeScript'
        },
        {
          available: false,
          title: 'Figma Design Resources'
        },
        {
          available: false,
          title: 'Create Multiple Products'
        },
        {
          available: false,
          title: 'Create a SaaS Project'
        },
        {
          available: false,
          title: 'Resale Product'
        },
        {
          available: false,
          title: 'Separate sale of our UI Elements?'
        }
      ]
    },
    {
      type: 'popular',
      title: 'Basic',
      serviceCount: 5,
      yearly: 529,
      monthly: 129,
      features: [
        {
          available: true,
          title: 'One End Product'
        },
        {
          available: true,
          title: 'No attribution required'
        },
        {
          available: true,
          title: 'TypeScript'
        },
        {
          available: true,
          title: 'Figma Design Resources'
        },
        {
          available: true,
          title: 'Create Multiple Products'
        },
        {
          available: false,
          title: 'Create a SaaS Project'
        },
        {
          available: false,
          title: 'Resale Product'
        },
        {
          available: false,
          title: 'Separate sale of our UI Elements?'
        }
      ]
    },
    {
      type: 'premium',
      title: 'Premium',
      serviceCount: 8,
      yearly: 1299,
      monthly: 599,
      features: [
        {
          available: true,
          title: 'One End Product'
        },
        {
          available: true,
          title: 'No attribution required'
        },
        {
          available: true,
          title: 'TypeScript'
        },
        {
          available: true,
          title: 'Figma Design Resources'
        },
        {
          available: true,
          title: 'Create Multiple Products'
        },
        {
          available: true,
          title: 'Create a SaaS Project'
        },
        {
          available: true,
          title: 'Resale Product'
        },
        {
          available: true,
          title: 'Separate sale of our UI Elements?'
        }
      ]
    }
  ];
}
