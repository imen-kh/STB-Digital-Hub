// angular import
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, minLength, required } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

interface studentForm {
  firstName: string;
  lastName: string;
  email: string;
  joiningDate: Date;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
  gender: string;
  designation: string;
  department: string;
  dateOfBirth: Date;
  education: string;
  // eslint-disable-next-line
  file: any;
}

@Component({
  selector: 'app-student-add',
  imports: [...SHARED_IMPORTS, FormField],
  templateUrl: './student-add.component.html',
  styleUrl: './student-add.component.scss'
})
export class StudentAddComponent {
  private cd = inject(ChangeDetectorRef);

  submitted = signal(false);
  error = signal('');

  basicInfoFormModal = signal<studentForm>({
    firstName: '',
    lastName: '',
    email: '',
    joiningDate: new Date(),
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    gender: '',
    designation: '',
    department: '',
    dateOfBirth: new Date(),
    education: '',
    file: null
  });

  basicInfoForm = form(this.basicInfoFormModal, (form) => {
    required(form.firstName, { message: 'First Name is required' });
    required(form.lastName, { message: 'Last Name is required' });
    required(form.email, { message: 'Email is required' });
    required(form.joiningDate, { message: 'Joining Date is required' });
    required(form.password, { message: 'Password is required' });
    required(form.confirmPassword, { message: 'Confirm Password is required' });
    required(form.mobileNumber, { message: 'Mobile Number is required' });
    required(form.gender, { message: 'Gender is required' });
    required(form.designation, { message: 'Designation is required' });
    required(form.department, { message: 'Department is required' });
    required(form.dateOfBirth, { message: 'Date of Birth is required' });
    required(form.education, { message: 'Education is required' });
    required(form.file, { message: 'File is required' });
    minLength(form.password, 8, { message: 'Password must be at least 8 characters' });
    minLength(form.confirmPassword, 8, { message: 'Confirm Password must be at least 8 characters' });
  });

  passwordErrors() {
    return this.basicInfoForm.password().errors();
  }

  confirmErrors() {
    return this.basicInfoForm.confirmPassword().errors();
  }

  readonly passwordMismatch = computed(() => {
    const value = this.basicInfoForm().value();
    if (!value.password || !value.confirmPassword) {
      return false;
    }
    return value.password !== value.confirmPassword;
  });

  onSubmit(event: Event) {
    this.submitted.set(true);
    if (this.passwordMismatch()) {
      this.error.set('Passwords do not match');
      return;
    }
    this.error.set('');
    event.preventDefault();
    const credentials = this.basicInfoFormModal();
    console.log('login user logged in with:', credentials);
    this.cd.detectChanges();
  }
}
