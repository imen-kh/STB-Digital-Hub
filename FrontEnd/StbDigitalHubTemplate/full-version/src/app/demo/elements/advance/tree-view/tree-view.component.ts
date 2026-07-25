// Angular Import
import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ArrayDataSource } from '@angular/cdk/collections';

// material import
import { CdkTree, CdkTreeModule } from '@angular/cdk/tree';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

/**
 * Food data with nested structure.
 * Each node has a name and an optional list of children.
 */
interface NestedFoodNode {
  name: string;
  children?: NestedFoodNode[];
}

const EXAMPLE_DATA: NestedFoodNode[] = [
  {
    name: 'Fruit',
    children: [{ name: 'Apple' }, { name: 'Banana' }, { name: 'Fruit loops' }]
  },
  {
    name: 'Vegetables',
    children: [
      {
        name: 'Green',
        children: [{ name: 'Broccoli' }, { name: 'Brussels sprouts' }]
      },
      {
        name: 'Orange',
        children: [{ name: 'Pumpkins' }, { name: 'Carrots' }]
      }
    ]
  }
];

function flattenNodes(nodes: NestedFoodNode[]): NestedFoodNode[] {
  const flattenedNodes = [];
  for (const node of nodes) {
    flattenedNodes.push(node);
    if (node.children) {
      flattenedNodes.push(...flattenNodes(node.children));
    }
  }
  return flattenedNodes;
}

@Component({
  selector: 'app-tree-view',
  imports: [MatTreeModule, MatButtonModule, MatIconModule, ...SHARED_IMPORTS, CdkTreeModule],
  templateUrl: './tree-view.component.html',
  styleUrl: './tree-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class TreeViewComponent {
  readonly tree = viewChild.required(CdkTree);

  childrenAccessor = (dataNode: NestedFoodNode) => dataNode.children ?? [];

  dataSource = new ArrayDataSource(EXAMPLE_DATA);

  hasChild = (_: number, node: NestedFoodNode) => !!node.children?.length;

  getParentNode(node: NestedFoodNode) {
    for (const parent of flattenNodes(EXAMPLE_DATA)) {
      if (parent.children?.includes(node)) {
        return parent;
      }
    }

    return null;
  }

  shouldRender(node: NestedFoodNode) {
    let parent = this.getParentNode(node);
    while (parent) {
      if (!this.tree().isExpanded(parent)) {
        return false;
      }
      parent = this.getParentNode(parent);
    }
    return true;
  }
}
