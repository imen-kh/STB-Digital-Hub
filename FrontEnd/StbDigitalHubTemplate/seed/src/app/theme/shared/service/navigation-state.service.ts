import { Injectable, signal, computed } from '@angular/core';
import { NavigationItem } from '../../layout/admin/navigation/navigation';

/**
 * Service that manages the expanded/collapsed state of navigation menu items.
 * Uses Angular signals for reactive state management.
 * Ensures only one menu path is expanded at a time.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationStateService {
  /**
   * Signal containing the array of expanded menu item IDs.
   * The array represents the path from root to the deepest expanded item.
   * e.g., ['Dashboard', 'analytics'] means Dashboard group is expanded with analytics active
   */
  private _expandedPath = signal<string[]>([]);

  /** Public readonly access to expanded path */
  readonly expandedPath = this._expandedPath.asReadonly();

  /**
   * Toggle a menu item's expanded state.
   * If the item is already expanded, it collapses.
   * If the item is collapsed, it expands and collapses any sibling paths.
   *
   * @param itemId - The ID of the menu item to toggle
   * @param parentPath - Array of parent item IDs from root to this item's parent
   */
  toggleMenuItem(itemId: string, parentPath: string[]): void {
    const currentPath = this._expandedPath();
    const newPath = [...parentPath, itemId];

    // Check if this exact item is already the last in the expanded path
    const isCurrentlyExpanded =
      this.isItemInPath(itemId, currentPath) && currentPath.length === newPath.length && currentPath[currentPath.length - 1] === itemId;

    if (isCurrentlyExpanded) {
      // Collapse: remove this item from path (keep parents expanded)
      this._expandedPath.set(parentPath);
    } else {
      // Expand: set the new path (this automatically collapses siblings)
      this._expandedPath.set(newPath);
    }
  }

  /**
   * Check if a specific item is currently expanded.
   * Returns a computed signal for reactive updates.
   *
   * @param itemId - The ID of the menu item to check
   */
  isExpanded(itemId: string): boolean {
    return this.isItemInPath(itemId, this._expandedPath());
  }

  /**
   * Create a computed signal that reactively tracks if an item is expanded.
   *
   * @param itemId - The ID of the menu item to track
   */
  createExpandedSignal(itemId: string) {
    return computed(() => this.isItemInPath(itemId, this._expandedPath()));
  }

  /**
   * Set the expanded path based on the current route URL.
   * Finds the navigation item matching the URL and expands its entire parent chain.
   *
   * @param currentUrl - The current route URL
   * @param navigationItems - The full navigation tree
   */
  setActivePathFromRoute(currentUrl: string, navigationItems: NavigationItem[]): void {
    const path = this.findPathToUrl(currentUrl, navigationItems, []);
    if (path.length > 0) {
      // Expand all parent items (exclude the leaf item which is type 'item')
      this._expandedPath.set(path.slice(0, -1));
    }
  }

  /**
   * Close all expanded menus.
   */
  closeAll(): void {
    this._expandedPath.set([]);
  }

  /**
   * Helper: Check if an item ID exists in a path array.
   */
  private isItemInPath(itemId: string, path: string[]): boolean {
    return path.includes(itemId);
  }

  /**
   * Helper: Recursively find the path to a navigation item by URL.
   * Returns an array of item IDs from root to the matching item.
   */
  private findPathToUrl(url: string, items: NavigationItem[], currentPath: string[]): string[] {
    for (const item of items) {
      const newPath = [...currentPath, item.id];

      // Check if this item's URL matches
      if (item.url && url.includes(item.url)) {
        return newPath;
      }

      // Recursively search children
      if (item.children && item.children.length > 0) {
        const foundPath = this.findPathToUrl(url, item.children, newPath);
        if (foundPath.length > 0) {
          return foundPath;
        }
      }
    }

    return [];
  }
}
