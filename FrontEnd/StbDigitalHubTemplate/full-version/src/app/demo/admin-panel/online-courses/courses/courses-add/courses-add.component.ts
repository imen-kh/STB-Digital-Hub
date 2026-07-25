// angular import
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { FileUploadControl, FileUploadModule, FileUploadValidators } from '@iplab/ngx-file-upload';

// rxjs
import { BehaviorSubject, Subscription } from 'rxjs';

interface courseForm {
  name: string;
  code: string;
  duration: string;
  price: string;
  description: string;
  startdate: Date;
  teacherName: string;
  maxStudents: string;
  status: string;
}

@Component({
  selector: 'app-courses-add',
  imports: [...SHARED_IMPORTS, FileUploadModule, FormField],
  templateUrl: './courses-add.component.html',
  styleUrl: './courses-add.component.scss'
})
export class CoursesAddComponent implements OnInit, OnDestroy {

  submitted = signal(false);
  error = signal('');

  courseFormModal = signal<courseForm>({
    name: '',
    code: '',
    duration: '',
    price: '',
    description: '',
    startdate: new Date(),
    teacherName: '',
    maxStudents: '',
    status: ''
  });

  // public props
  fileSub = new Subscription();

  // private props
  // eslint-disable-next-line
  readonly uploadedFile: BehaviorSubject<any> = new BehaviorSubject(null);
  readonly control = new FileUploadControl({ listVisible: true, accept: ['image/*'], discardInvalid: true, multiple: false }, [
    FileUploadValidators.accept(['image/*']),
    FileUploadValidators.filesLimit(1)
  ]);

  // life cycle
  ngOnInit(): void {
    this.fileSub = this.control.valueChanges.subscribe((values: Array<File>) => this.getImage(values[0]));
  }

  ngOnDestroy(): void {
    this.fileSub.unsubscribe();
  }

  // private method
  private getImage(file: File): void {
    if (FileReader && file) {
      const fr = new FileReader();
      fr.onload = (e) => this.uploadedFile.next(e.target!.result);
      fr.readAsDataURL(file);
    } else {
      this.uploadedFile.next(null);
    }
  }

  courseForm = form(this.courseFormModal, (form) => {
    required(form.name, { message: 'Name is required' });
    required(form.code, { message: 'Code is required' });
    required(form.duration, { message: 'Duration is required' });
    required(form.price, { message: 'Price is required' });
    required(form.description, { message: 'Description is required' });
    required(form.startdate, { message: 'Start Date is required' });
    required(form.teacherName, { message: 'Teacher Name is required' });
    required(form.maxStudents, { message: 'Max Students is required' });
    required(form.status, { message: 'Course Image is required' });
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
  }
}
