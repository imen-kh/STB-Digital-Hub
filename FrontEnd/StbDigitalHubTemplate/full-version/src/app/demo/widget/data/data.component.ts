// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-data',
  imports: [CommonModule, ...SHARED_IMPORTS, ScrollbarComponent],
  templateUrl: './data.component.html',
  styleUrl: './data.component.scss'
})
export class DataComponent {
  // public props
  todo_list_message_error!: boolean;
  newTaskTitle!: string; // for todo list

  // public method
  tasks: Task[] = [
    { id: 1, title: 'Check your Email', completed: false },
    { id: 2, title: 'Make YouTube Video', completed: true },
    { id: 3, title: 'Create Banner', completed: false },
    { id: 4, title: 'Upload Project', completed: true },
    { id: 5, title: 'Update User Story', completed: false },
    { id: 6, title: 'Update Task', completed: false }
  ];

  addTodoList() {
    if (this.newTaskTitle === '' || this.newTaskTitle === undefined) {
      this.todo_list_message_error = true;
    } else {
      this.todo_list_message_error = false;
      const newTask: Task = {
        id: this.tasks.length + 1,
        title: this.newTaskTitle,
        completed: false
      };
      this.tasks.push(newTask);
      this.newTaskTitle = '';
    }
  }

  deleteTask(taskId: number) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }
  progressData = [
    {
      label: 'Direct',
      percentage: '25%',
      type: 'primary',
      progress: '75'
    },
    {
      label: 'Social',
      margin: 'mt-4',
      type: 'secondary',
      progress: '50',
      percentage: '58'
    },
    {
      label: 'Referral',
      margin: 'mt-4',
      percentage: '20%',
      type: 'primary',
      progress: '20'
    },
    {
      label: 'Bounce',
      margin: 'mt-4',
      percentage: '580',
      type: 'secondary',
      progress: '40'
    },
    {
      label: 'Internet',
      margin: 'mt-4',
      percentage: '70%',
      type: 'primary',
      progress: '70'
    }
  ];

  tableList = [
    {
      name: 'HeadPhone',
      sale: '2136',
      price: '$ 926.23',
      color: 'text-success'
    },
    {
      name: 'Iphone 6',
      sale: '2546',
      price: '$ 485.85',
      color: 'text-danger'
    },
    {
      name: 'Jacket',
      sale: '2681',
      price: '$ 786.4',
      color: 'text-primary'
    },
    {
      name: 'HeadPhone',
      sale: '2756',
      price: '$ 563.45',
      color: 'text-info'
    },
    {
      name: 'Sofa',
      sale: '8756',
      price: '$ 769.45',
      color: 'text-danger'
    },
    {
      name: 'Iphone 7',
      sale: '3652',
      price: '$ 754.45',
      color: 'text-warning'
    },
    {
      name: 'Jacket',
      sale: '7456',
      price: '$ 743.23',
      color: 'text-success'
    }
  ];

  revenueList = [
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '+ $145.85'
    },
    {
      color: 'text-danger',
      name: 'Ethereum',
      percentage: '- $6.368'
    },
    {
      color: 'text-success',
      name: 'Ripple',
      percentage: '+ $458.63'
    },
    {
      color: 'text-danger',
      name: 'Neo',
      percentage: '- $5.631'
    },
    {
      color: 'text-danger',
      name: 'Bitcoin',
      percentage: '- $75.86'
    },
    {
      color: 'text-success',
      name: 'Ethereum',
      percentage: '+ $453.63'
    },
    {
      color: 'text-danger',
      name: 'Ripple',
      percentage: '+ $786.63'
    },
    {
      color: 'text-success',
      name: 'Neo',
      percentage: '+ $145.85'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '- $6.368'
    },
    {
      color: 'text-success',
      name: 'Ethereum',
      percentage: '+ $458.63'
    },
    {
      color: 'text-danger',
      name: 'Neo',
      percentage: '- $5.631'
    },
    {
      color: 'text-danger',
      name: 'Ripple',
      percentage: '+ $145.85'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '- $75.86'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '+ $453.63'
    },
    {
      color: 'text-danger',
      name: 'Ethereum',
      percentage: '+ $786.63'
    }
  ];

  imgList = [
    {
      src: 'assets/images/user/avatar-2.jpg'
    },
    {
      src: 'assets/images/user/avatar-3.jpg'
    },
    {
      src: 'assets/images/user/avatar-4.jpg'
    },
    {
      src: 'assets/images/user/avatar-3.jpg'
    }
  ];

  imgList1 = [
    {
      src: 'assets/images/user/avatar-2.jpg'
    },
    {
      src: 'assets/images/user/avatar-3.jpg'
    },
    {
      src: 'assets/images/user/avatar-4.jpg'
    }
  ];

  userActivity = [
    {
      src: 'assets/images/user/avatar-4.jpg',
      name: 'John Deo',
      time: '2 min ago',
      text: 'Lorem Ipsum is simply dummy text.',
      space: 'mb-4'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      name: 'John Deo',
      time: '2 min ago',
      text: 'Lorem Ipsum is simply dummy text.',
      space: 'mb-4'
    },
    {
      src: 'assets/images/user/avatar-2.jpg',
      name: 'John Deo',
      time: '2 min ago',
      text: 'Lorem Ipsum is simply dummy text.',
      space: 'mb-4'
    },
    {
      src: 'assets/images/user/avatar-1.jpg',
      name: 'John Deo',
      time: '2 min ago',
      text: 'Lorem Ipsum is simply dummy text.'
    }
  ];

  UpdateList = [
    {
      text: 'You’re getting more and more followers, keep it up!',
      user: '+ 1652 Followers',
      time: '2 hrs ago',
      icon: 'icon-twitter bg-twitter',
      space: 'pb-4'
    },
    {
      text: 'Congratulations!',
      user: '+ 5 New Products were added!',
      time: '4 hrs ago',
      icon: 'icon-briefcase bg-danger',
      space: 'pb-4'
    },
    {
      text: 'Download the latest backup',
      user: 'Database backup completed!',
      time: '1 day ago',
      icon: 'icon-check f-w-600 bg-success',
      space: 'pb-4'
    },
    {
      text: 'This is great, keep it up!',
      user: '+2 Friend Requests',
      time: '2 day ago',
      icon: 'icon-facebook bg-primary'
    }
  ];

  projectList = [
    {
      src: 'assets/images/user/avatar-4.jpg',
      user: 'John Deo',
      position: 'Graphics Designer',
      name: 'Able Pro',
      date: 'Jun, 26',
      value: 'Low',
      color: 'bg-light-danger'
    },
    {
      src: 'assets/images/user/avatar-2.jpg',
      user: 'Jenifer Vintage',
      position: 'Web Designer',
      name: 'Mashable',
      date: 'March, 31',
      value: 'High',
      color: 'bg-light-primary'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      user: 'William Jem',
      position: 'Developer',
      name: 'Flatable',
      date: 'Aug, 02',
      value: 'Medium',
      color: 'bg-light-success'
    },
    {
      src: 'assets/images/user/avatar-2.jpg',
      user: 'David Jones',
      position: 'Developer',
      name: 'Guruable',
      date: 'Sep, 22',
      value: 'High',
      color: 'bg-light-primary'
    }
  ];

  appSaleList = [
    {
      user: 'Able Pro',
      text: 'Powerful Admin Theme',
      sale: '16,300',
      price: '$53',
      total: '$15,652'
    },
    {
      user: 'Photoshop',
      text: 'Design Software',
      sale: '26,421',
      price: '$35',
      total: '$18,785'
    },
    {
      user: 'Guruable',
      text: 'Best Admin Template',
      sale: '8,265',
      price: '$98',
      total: '$9,652'
    },
    {
      user: 'Flatable',
      text: 'Admin App',
      sale: '10,652',
      price: '$20',
      total: '$7,856'
    },
    {
      user: 'Guruable',
      text: 'Best Admin Template',
      sale: '8,265',
      price: '$98',
      total: '$9,652'
    }
  ];

  activeList = [
    {
      time: '12',
      src: 'assets/images/user/avatar-4.jpg',
      user: 'John Deo',
      text: '[#1183] Workaround for OS X selects printing bug',
      description: 'Chrome fixed the bug several versions ago, thus rendering this...'
    },
    {
      time: '16',
      src: 'assets/images/user/avatar-3.jpg',
      user: 'Jems Win',
      text: '[#1249] Vertically center carousel controls',
      description: 'Try any carousel control and reduce the screen width below...'
    },
    {
      time: '40',
      src: 'assets/images/user/avatar-2.jpg',
      user: 'Jeny Wiliiam',
      text: '[#1254] Inaccurate small pagination height',
      description: 'The height of pagination elements is not consistent with... '
    },
    {
      time: '16',
      src: 'assets/images/user/avatar-3.jpg',
      user: 'Jems Win',
      text: '[#1249] Vertically center carousel controls',
      description: 'Try any carousel control and reduce the screen width below...'
    }
  ];

  latestPost = [
    {
      src: 'assets/images/widget/dashborad-1.jpg'
    },
    {
      src: 'assets/images/widget/dashborad-3.jpg'
    }
  ];

  feedsList = [
    {
      text: 'You have 3 pending tasks.',
      time: 'Just Now',
      icon: 'icon-bell bg-light-primary'
    },
    {
      text: ' New order received.',
      time: '30 min ago',
      icon: 'icon-shopping-cart bg-light-danger'
    },
    {
      text: 'You have 3 pending tasks.',
      time: 'Just Now',
      icon: 'icon-file-text bg-light-success'
    },
    {
      text: 'You have 4 tasks Done.',
      time: '1 hours ago',
      icon: 'icon-bell bg-light-primary'
    },
    {
      text: 'You have 2 pending tasks.',
      time: 'Just Now',
      icon: 'icon-file-text bg-light-success'
    },
    {
      text: ' New order received.',
      time: '4 hours ago',
      icon: 'icon-shopping-cart bg-light-danger'
    },
    {
      text: 'New order Done ',
      time: 'Just Now',
      icon: 'icon-shopping-cart bg-light-danger'
    },
    {
      text: 'You have 5 pending tasks',
      time: '5 hours ago',
      icon: 'icon-file-text bg-light-success'
    },
    {
      text: 'You have 4 tasks Done.',
      time: '2 hours ago',
      icon: 'icon-bell bg-light-primary'
    }
  ];

  customersList = [
    {
      src: 'assets/images/widget/GERMANY.jpg',
      country: 'Germany',
      name: 'Anjalina Jolly',
      average: '56.23%'
    },
    {
      src: 'assets/images/widget/USA.jpg',
      country: 'USA',
      name: 'John Deo',
      average: '25.23%'
    },
    {
      src: 'assets/images/widget/AUSTRALIA.jpg',
      country: 'Australia',
      name: 'Jenifer Vintage',
      average: '12.45%'
    },
    {
      src: 'assets/images/widget/UK.jpg',
      country: 'United Kingdom',
      name: 'Lori Moore',
      average: '8.65%'
    },
    {
      src: 'assets/images/widget/BRAZIL.jpg',
      country: 'Brazilm',
      name: 'Allina D’croze',
      average: '3.56%%'
    },
    {
      src: 'assets/images/widget/AUSTRALIA.jpg',
      country: 'Australia',
      name: 'Jenifer Vintage',
      average: '12.45%'
    },
    {
      src: 'assets/images/widget/USA.jpg',
      country: 'USA',
      name: 'John Deo',
      average: '25.23%'
    },
    {
      src: 'assets/images/widget/UK.jpg',
      country: 'United Kingdom',
      name: 'Lori Moore',
      average: '8.65%'
    }
  ];

  latestOrderList = [
    {
      user: 'John Deo',
      Id: '#81412314',
      src: 'assets/images/widget/PHONE1.jpg',
      product: 'Moto G5',
      qty: '10',
      date: '17-2-2017',
      status: 'Pending',
      bgcolor: 'bg-light-warning'
    },
    {
      user: 'Jenny William',
      Id: '#68457898',
      src: 'assets/images/widget/PHONE2.jpg',
      product: 'iPhone 8',
      qty: '16',
      date: '20-2-2017',
      status: 'Paid',
      bgcolor: 'bg-light-primary'
    },
    {
      user: 'Lori Moore',
      Id: '#45457898',
      src: 'assets/images/widget/PHONE3.jpg',
      product: 'Redmi 4',
      qty: '20',
      date: '17-2-2017',
      status: 'Success',
      bgcolor: 'bg-light-success'
    },
    {
      user: 'Austin Pena',
      Id: '#62446232',
      src: 'assets/images/widget/PHONE4.jpg',
      product: 'Jio',
      qty: '15',
      date: '25-4-2017',
      status: 'Failed',
      bgcolor: 'bg-light-danger'
    }
  ];

  incomingList = [
    {
      text: 'Incoming requests',
      color: 'text-primary'
    },
    {
      text: 'You have 2 pending requests..',
      color: 'text-success'
    },
    {
      text: 'You have 3 pending requests..',
      color: 'text-danger'
    },
    {
      text: 'New order received',
      color: 'text-warning'
    },
    {
      text: 'Incoming requests',
      color: 'text-info'
    },
    {
      text: 'The 3 Golden Rules Professional Design..',
      color: 'text-success'
    },
    {
      text: 'You have 4 pending tasks',
      color: 'text-danger'
    }
  ];

  newCustomerList = [
    {
      src: 'assets/images/user/avatar-1.jpg',
      user: 'Alex Thompson',
      text: 'Cheers!',
      status: 'active'
    },
    {
      src: 'assets/images/user/avatar-2.jpg',
      user: 'John Doue',
      text: 'stay hungry stay foolish!',
      status: 'active'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      user: 'Alex Thompson',
      text: 'Cheers!',
      status: 'deactive',
      time: '30 min ago',
      icon: 'far fa-clock'
    },
    {
      src: 'assets/images/user/avatar-4.jpg',
      user: 'John Doue',
      text: 'Cheers!',
      status: 'deactive',
      time: '10 min ago',
      icon: 'far fa-clock'
    },
    {
      src: 'assets/images/user/avatar-5.jpg',
      user: 'Shirley Hoe',
      text: 'stay hungry stay foolish!',
      status: 'active'
    },
    {
      src: 'assets/images/user/avatar-1.jpg',
      user: 'John Doue',
      text: 'Cheers!',
      status: 'active'
    },
    {
      src: 'assets/images/user/avatar-2.jpg',
      user: 'Shirley HoJames Alexander',
      text: 'stay hungry stay foolish!',
      status: 'active'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      user: 'John Doue',
      text: 'Cheers!',
      status: 'deactive',
      time: '10 min ago',
      icon: 'far fa-clock'
    }
  ];

  recentList = [
    {
      sub: 'Website down for one week',
      department: 'Support',
      time: 'Today 2:00',
      status: 'open',
      bgcolor: ' bg-light-success'
    },
    {
      sub: 'Loosing control on server',
      department: 'Support',
      time: 'Yesterday',
      status: 'progress',
      bgcolor: 'bg-light-primary'
    },
    {
      sub: 'Authorizations keys',
      department: 'Support',
      time: '27, Aug',
      status: 'closed',
      bgcolor: 'bg-light-danger'
    },
    {
      sub: 'Restoring default settings',
      department: 'Support',
      time: 'Today 9:00',
      status: 'open',
      bgcolor: 'bg-light-success'
    },
    {
      sub: 'Loosing control on server',
      department: 'Support',
      time: 'Yesterday',
      status: 'progress',
      bgcolor: 'bg-light-primary'
    },
    {
      sub: 'Restoring default settings',
      department: 'Support',
      time: 'Today 9:00',
      status: 'progress',
      bgcolor: 'bg-light-success'
    },
    {
      sub: 'Loosing control on server',
      department: 'Support',
      time: 'Yesterday',
      status: 'progress',
      bgcolor: 'bg-light-primary'
    },
    {
      sub: 'Authorizations keys',
      department: 'Support',
      time: '27, Aug',
      status: 'closed',
      bgcolor: 'bg-light-danger'
    }
  ];
}
