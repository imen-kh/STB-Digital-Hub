// Angular Import
import { Component, inject } from '@angular/core';

// third party
import { NotifierService, NotifierModule } from 'angular-notifier';

// Project imports
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-adv-notification',
  imports: [CardComponent, NotifierModule],
  templateUrl: './adv-notification.component.html',
  styleUrl: './adv-notification.component.scss'
})
export class AdvNotificationComponent {
  /**
   * Notifier service
   */
  private notifier: NotifierService;

  /**
   * Constructor
   *
   * @param {NotifierService} notifier Notifier service
   */
  constructor() {
    const notifier = inject(NotifierService);

    this.notifier = notifier;
  }

  /**
   * Show a notification
   *
   * @param {string} type    Notification type
   * @param {string} message Notification message
   */
  public showNotification(type: string, message: string): void {
    this.notifier.notify(type, message);
  }

  /**
   * Hide oldest notification
   */
  public hideOldestNotification(): void {
    this.notifier.hideOldest();
  }

  /**
   * Hide newest notification
   */
  public hideNewestNotification(): void {
    this.notifier.hideNewest();
  }

  /**
   * Hide all notifications at once
   */
  public hideAllNotifications(): void {
    this.notifier.hideAll();
  }

  /**
   * Show a specific notification (with a custom notification ID)
   *
   * @param {string} type    Notification type
   * @param {string} message Notification message
   * @param {string} id      Notification ID
   */
  public showSpecificNotification(type: string, message: string, id: string): void {
    this.notifier.show({
      id,
      message,
      type
    });
  }

  /**
   * Hide a specific notification (by a given notification ID)
   *
   * @param {string} id Notification ID
   */
  public hideSpecificNotification(id: string): void {
    this.notifier.hide(id);
  }
}
