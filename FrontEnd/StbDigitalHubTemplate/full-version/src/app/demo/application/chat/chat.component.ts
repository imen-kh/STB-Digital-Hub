// angular import
import { Component, OnInit, TemplateRef, inject } from '@angular/core';

// bootstrap import
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import chatPerson from 'src/fake-data/chat.json';
import chatHistory from 'src/fake-data/chat-history.json';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

interface chatHistory {
  id: number;
  from: string;
  to: string;
  text: string;
  time: string;
}
interface chatPerson {
  id: number;
  name: string;
  company: string;
  role: string;
  work_email: string;
  personal_email: string;
  work_phone: string;
  personal_phone: string;
  location: string;
  avatar: string;
  status: string;
  lastMessage: string;
  birthdayText: string;
  unReadChatCount: number;
  online_status: string;
}

@Component({
  selector: 'app-chat',
  imports: [...SHARED_IMPORTS, ScrollbarComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  private offcanvasService = inject(NgbOffcanvas);
  // private breakpointObserver = inject(BreakpointObserver);

  // public props
  status: string = 'bg-success';
  message: string = '';
  errorMessage: string = '';
  closeResult = '';

  scrollbarResize!: boolean;
  isCollapsed = false;
  listIsCollapsed = true;
  getUser!: chatPerson;
  findUserHistory!: chatHistory[];
  chatHistory: chatPerson[] = chatPerson;
  chatData: chatHistory[] = chatHistory;
  selectedPersonId!: number;

  // life cycle method
  ngOnInit() {
    // this.breakpointObserver.observe([MAX_WIDTH_1377PX, MIN_WIDTH_1200PX]).subscribe((result) => {
    //   if (result.breakpoints[MAX_WIDTH_1377PX]) {
    //   } else if (result.breakpoints[MIN_WIDTH_1200PX]) {
    //     this.scrollbarResize = false;
    //   }
    // });

    this.getUser = chatPerson[0];
    this.findUserHistory = chatHistory.filter((x) => x.from === 'Alene' || x.to === 'Alene');
    this.selectedPersonId = this.getUser.id;
  }

  // Private methods
  chatPerson(id: number) {
    this.getUser = this.chatHistory.filter((x) => x.id === id)[0];
    this.findUserHistory = this.chatData.filter((message) => message.from === this.getUser.name || message.to === this.getUser.name);
    this.selectedPersonId = this.getUser.id;
  }

  sendNewMessage(name: string) {
    if (this.message.trim() !== '') {
      const newMessage = {
        id: Math.max(...this.chatHistory.map((message) => message.id), 0) + 1, // You need to implement a function to get the next available ID
        from: 'User1',
        to: name,
        text: this.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.findUserHistory.push(newMessage);
      this.message = '';
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Please Enter Any Message.';
    }
  }

  information = [
    {
      text: '32188 Sips Parkways, U.S',
      icon: 'pin_drop'
    },
    {
      text: '995-250-1803',
      icon: 'call'
    },
    {
      text: 'O’Keefe@codedtheme.com',
      icon: 'email'
    }
  ];

  friends = [
    {
      src: 'assets/images/application/img-catalog1.png'
    },
    {
      src: 'assets/images/application/img-catalog2.png'
    },
    {
      src: 'assets/images/application/img-catalog3.png'
    }
  ];

  open(content: TemplateRef<string>) {
    this.offcanvasService.open(content, { position: 'start' });
  }

  openInfo(content1: TemplateRef<string>) {
    this.offcanvasService.open(content1, { ariaLabelledBy: 'offcanvas-basic-title', position: 'end' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  // eslint-disable-next-line
  private getDismissReason(reason: any): string {
    switch (reason) {
      case OffcanvasDismissReasons.ESC:
        return 'by pressing ESC';
      case OffcanvasDismissReasons.BACKDROP_CLICK:
        return 'by clicking on the backdrop';
      default:
        return `with: ${reason}`;
    }
  }

  // main use status
  userStatus(status: string) {
    if (status === 'available') {
      this.status = 'bg-success';
    } else if (status === 'offline') {
      this.status = 'bg-warning';
    } else if (status === 'pending') {
      this.status = 'bg-danger';
    }
  }
}
