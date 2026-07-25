// angular import
import { Component, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Bootstrap Import
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

interface TodoItem {
  cId: number;
  msg: string;
  status: string;
  assign: string;
  priority: string;
  date: string;
  isCollapsed: boolean;
}

interface collapseList {
  cId1: number;
  msg1: string;
  status1: string;
  assign1: string;
  priority1: string;
  date1: string;
  isCollapsed: boolean;
}

@Component({
  selector: 'app-backlog',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './backlog.component.html',
  styleUrl: './backlog.component.scss'
})
export class BacklogComponent {
  private offcanvasService = inject(NgbOffcanvas);

  //private props
  closeResult = 'string';
  todoListMessage!: string;
  statusListMessage!: string;
  assignListMessage!: string;
  dateListMessage!: string;
  priorityListMessage!: string;
  todoCollapseMessage!: string;
  statusCollapseMessage!: string;
  assignCollapseMessage!: string;
  dateCollapseMessage!: string;
  priorityCollapseMessage!: string;
  todo_list_message_error!: boolean;
  todo_collapse_message_error!: boolean;
  todoList: TodoItem[] = [];
  collapseList: collapseList[] = [];
  isCollapsed!: boolean;

  // Constructor
  constructor() {
    const random = Math.floor(Math.random() * (999999 - 100000)) + 100000;
    this.todoList.push({
      cId: random,
      msg: 'School Management Backend',
      status: 'closed',
      assign: 'Maddison Wilber',
      priority: 'Low',
      date: '07/22/2022',
      isCollapsed: true
    });
    this.todoList.push({
      cId: random,
      msg: 'Inventory Implementation & Design',
      status: 'New',
      assign: 'Maddison Wilber',
      priority: 'Low',
      date: '07/22/2022',
      isCollapsed: true
    });
    this.todoList.push({
      cId: random,
      msg: 'Theme migration from v4 to v5',
      status: 'New',
      assign: 'Maddison Wilber',
      priority: 'Low',
      date: '07/22/2022',
      isCollapsed: true
    });
    this.todoList.push({
      cId: random,
      msg: 'Lunch Beauty Application',
      status: 'New',
      assign: 'Maddison Wilber',
      priority: 'Low',
      date: '07/22/2022',
      isCollapsed: true
    });
    this.collapseList.push({
      cId1: random,
      msg1: 'Online fees payment & instant announcements',
      status1: 'closed',
      assign1: 'Maddison Wilber',
      priority1: 'Low',
      date1: '07/22/20228',
      isCollapsed: true
    });
    this.collapseList.push({
      cId1: random,
      msg1: 'Attendance checking & homework details',
      status1: 'closed',
      assign1: 'Maddison Wilber',
      priority1: 'Low',
      date1: '07/22/20228',
      isCollapsed: true
    });
    this.collapseList.push({
      cId1: random,
      msg1: 'Admission, Staff & Schedule management',
      status1: 'closed',
      assign1: 'Maddison Wilber',
      priority1: 'Low',
      date1: '07/22/20228',
      isCollapsed: true
    });
  }

  // private Method
  collapseData(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  collapseData1(content1: TemplateRef<string>) {
    this.offcanvasService.open(content1, { position: 'end' });
  }

  addTodoList() {
    if (
      (this.todoListMessage === '' || this.todoListMessage === undefined,
      this.statusListMessage === '' || this.statusListMessage === undefined,
      this.assignListMessage === '' || this.assignListMessage === undefined,
      this.dateListMessage === '' || this.dateListMessage === undefined,
      this.priorityListMessage === '' || this.priorityListMessage === undefined)
    ) {
      this.todo_list_message_error = true;
    } else {
      const random = Math.floor(Math.random() * (999999 - 100000)) + 100000;
      this.todoList.push({
        cId: random,
        msg: this.todoListMessage,
        status: this.statusListMessage,
        assign: this.assignListMessage,
        date: this.dateListMessage,
        priority: this.priorityListMessage,
        isCollapsed: true
      });
      this.todoListMessage = '';
      this.statusListMessage = '';
      this.assignListMessage = '';
      this.dateListMessage = '';
      this.priorityListMessage = '';
    }
  }

  addCollapseList() {
    if (
      (this.todoCollapseMessage === '' || this.todoCollapseMessage === undefined,
      this.statusCollapseMessage === '' || this.statusCollapseMessage === undefined,
      this.assignCollapseMessage === '' || this.assignCollapseMessage === undefined,
      this.dateCollapseMessage === '' || this.dateCollapseMessage === undefined,
      this.priorityCollapseMessage === '' || this.priorityCollapseMessage === undefined)
    ) {
      this.todo_collapse_message_error = true;
    } else {
      const random = Math.floor(Math.random() * (999999 - 100000)) + 100000;
      this.collapseList.push({
        cId1: random,
        msg1: this.todoCollapseMessage,
        status1: this.statusCollapseMessage,
        assign1: this.assignCollapseMessage,
        date1: this.dateCollapseMessage,
        priority1: this.priorityCollapseMessage,
        isCollapsed: true
      });
      this.todoCollapseMessage = '';
      this.statusCollapseMessage = '';
      this.assignCollapseMessage = '';
      this.dateCollapseMessage = '';
      this.priorityCollapseMessage = '';
    }
  }
}
