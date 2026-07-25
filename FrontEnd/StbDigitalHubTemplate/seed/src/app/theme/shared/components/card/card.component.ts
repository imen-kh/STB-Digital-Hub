// Angular import
import { Component, ContentChild, ElementRef, TemplateRef, contentChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  // public props
  /**
   * Title of card. It will be visible at left side of card header
   */
  cardTitle = input<string>();

  /**
   * Class to be applied at card level
   */
  cardClass = input<string>();

  /**
   * To hide content from card
   */
  showContent = input(true);

  /**
   * Class to be applied at card content.
   */
  blockClass = input<string>();

  /**
   * Class to be applied on card header
   */
  headerClass = input<string>();

  /**
   * To hide header from card
   */
  showHeader = input(true);

  /**
   * Class to be applied on footer section of custom card
   */
  footerClass = input<string>();

  /**
   * padding around card content. default in px
   */
  padding = input<number>(); // set default to 24 px

  /**
   * Template reference of header actions on custom header
   */
  headerOptionsTemplate = contentChild<TemplateRef<ElementRef>>('headerOptionsTemplate');

  /**
   * Template reference of header actions besides title at left
   */
  headerTitleTemplate = contentChild<TemplateRef<ElementRef>>('headerTitleTemplate');

  /**
   * Template reference for footer at bottom
   */
  @ContentChild('footerTemplate') footerTemplate!: TemplateRef<ElementRef>;
}
