// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import Swal from 'sweetalert2';
import { SweetAlert2LoaderService } from '@sweetalert2/ngx-sweetalert2';

@Component({
  selector: 'app-sweet-alert',
  imports: [...SHARED_IMPORTS],
  templateUrl: './sweet-alert.component.html',
  styleUrl: './sweet-alert.component.scss',
  providers: [SweetAlert2LoaderService]
})
export class SweetAlertComponent {
  // private Method
  helloAlert() {
    Swal.fire('Hello world!');
  }

  successAlert() {
    Swal.fire('Good job!', 'You clicked the button!', 'success');
  }

  warningAlert() {
    Swal.fire('Good job!', 'You clicked the button!', 'warning');
  }

  errorAlert() {
    Swal.fire('Good job!', 'You clicked the button!', 'error');
  }

  infoAlert() {
    Swal.fire('Good job!', 'You clicked the button!', 'info');
  }

  basicMessageAlert() {
    Swal.fire('Any fool can use a computer');
  }

  textUnderAlert() {
    Swal.fire('The Internet?', 'That thing is still around?', 'question');
  }

  errorIconAlert() {
    Swal.fire({
      title: 'Oops...',
      icon: 'error',
      text: 'Something went wrong!',
      footer: '<a href="#">Why do I have this issue?</a>'
    });
  }

  longContentAlert() {
    Swal.fire({
      imageUrl: 'https://placeholder.pics/svg/300x1500',
      imageHeight: '1500',
      imageAlt: 'A tall image'
    });
  }

  customeHtmlAlert() {
    Swal.fire({
      title: '<strong>HTML <u>example</u></strong>',
      icon: 'info',
      html: 'You can use <b>bold text</b>, ' + '<a>links</a> ' + 'and other HTML tags',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: 'Great!'
    });
  }

  customedPositionAlert() {
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Your work has been saved',
      showConfirmButton: false,
      timer: 1500
    });
  }

  messageCustomImageAlert() {
    Swal.fire({
      title: 'Sweet!',
      text: 'Modal with a custom image.',
      imageUrl: 'https://unsplash.it/400/200',
      imageWidth: 400,
      imageHeight: 200,
      imageAlt: 'Custom image'
    });
  }

  rtlLanguageAlert() {
    Swal.fire({
      title: 'هل تريد الاستمرار؟',
      icon: 'question',
      iconHtml: '؟',
      confirmButtonText: 'نعم',
      cancelButtonText: 'لا',
      showCancelButton: true,
      showCloseButton: true
    });
  }

  customedTimerAlert() {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
    Toast.fire({
      icon: 'success',
      title: 'Signed in successfully'
    });
  }

  confirmAlert() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once deleted, you will not be able to recover this imaginary file!',
      icon: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete.dismiss) {
        Swal.fire('', 'Your imaginary file is safe!', 'error');
      } else {
        Swal.fire('', 'Poof! Your imaginary file has been deleted!', 'success');
      }
    });
  }

  threeBtn() {
    Swal.fire({
      title: 'Do you want to save the changes?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Save',
      denyButtonText: `Don't save`
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        Swal.fire('Saved!', '', 'success');
      } else if (result.isDenied) {
        Swal.fire('Changes are not saved', '', 'info');
      }
    });
  }

  twoBtn() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons
      .fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      })
      .then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire('Deleted!', 'Your file has been deleted.', 'success');
        } else if (
          /* Read more about handling dismissals below */
          result.dismiss === 'cancel'
        ) {
          swalWithBootstrapButtons.fire('Cancelled', 'Your imaginary file is safe :)', 'error');
        }
      });
  }

  autoClose() {
    // eslint-disable-next-line
    let timerInterval: any;
    Swal.fire({
      title: 'Auto close alert!',
      html: 'I will close in <b></b> milliseconds.',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
        const timer = Swal.getPopup()?.querySelector('b');
        timerInterval = setInterval(() => {
          timer!.textContent = `${Swal.getTimerLeft()}`;
        }, 100);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then((result) => {
      /* Read more about handling dismissals below */
      if (result.dismiss === 'timer') {
        console.log('I was closed by the timer');
      }
    });
  }

  promptAlert() {
    Swal.fire({
      text: 'Write something here:',
      input: 'text'
    }).then((result) => {
      if (result.value) {
        Swal.fire('', `You typed: ${result.value}`);
      }
    });
  }

  ajaxAlert() {
    Swal.fire({
      title: 'Submit your Github username',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Look up',
      showLoaderOnConfirm: true,
      preConfirm: async (login) => {
        try {
          const githubUrl = `
            https://api.github.com/users/${login}
          `;
          const response = await fetch(githubUrl);
          if (!response.ok) {
            return Swal.showValidationMessage(`
              ${JSON.stringify(await response.json())}
            `);
          }
          return response.json();
        } catch (error) {
          Swal.showValidationMessage(`
            Request failed: ${error}
          `);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: `${result.value.login}'s avatar`,
          imageUrl: result.value.avatar_url
        });
      }
    });
  }

  animationAlert() {
    Swal.fire({
      title: 'Custom animation with Animate.css',
      showClass: {
        popup: `
          animate__animated
          animate__fadeInUp
          animate__faster
        `
      },
      hideClass: {
        popup: `
          animate__animated
          animate__fadeOutDown
          animate__faster
        `
      }
    });
  }

  successModalAlert() {
    Swal.fire({
      title: 'Success modal',
      icon: 'success'
    });
  }

  errorModalAlert() {
    Swal.fire({
      title: 'Error modal',
      icon: 'error'
    });
  }

  warningModalAlert() {
    Swal.fire({
      title: 'Warning modal',
      icon: 'warning'
    });
  }

  infoModalAlert() {
    Swal.fire({
      title: 'Info modal',
      icon: 'info'
    });
  }

  questionModalAlert() {
    Swal.fire({
      title: 'Question modal',
      icon: 'question'
    });
  }

  ipAddressAlert() {
    Swal.fire({
      title: 'Enter your IP address',
      input: 'text'
    }).then((result) => {
      if (result.value) {
        Swal.fire(`Entered IP address: ${result.value}`);
      }
    });
  }

  passwordAlert() {
    Swal.fire({
      title: 'Enter your password',
      input: 'password',
      inputLabel: 'Password',
      inputPlaceholder: 'Enter your password',
      inputAttributes: {
        maxlength: '10',
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    }).then((result) => {
      if (result.value) {
        Swal.fire(`Entered password: ${result.value}`);
      }
    });
  }

  urlAlert() {
    Swal.fire({
      title: 'Enter your URl',
      input: 'password',
      inputLabel: 'Password',
      inputPlaceholder: 'Enter your password',
      inputAttributes: {
        maxlength: '10',
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    }).then((result) => {
      if (result.value) {
        Swal.fire(`Entered URL: ${result.value}`);
      }
    });
  }

  gmailAlert() {
    Swal.fire({
      title: 'Input email address',
      input: 'email',
      inputLabel: 'Your email address',
      inputPlaceholder: 'Enter your email address'
    }).then((result) => {
      if (result.value) {
        Swal.fire(`Entered email: ${result.value}`);
      }
    });
  }

  textAreaAlert() {
    Swal.fire({
      input: 'textarea',
      inputLabel: 'Message',
      inputPlaceholder: 'Type your message here...',
      inputAttributes: {
        'aria-label': 'Type your message here'
      },
      showCancelButton: true
    }).then((result) => {
      if (result.value) {
        Swal.fire(result.value);
      }
    });
  }

  selectAlert() {
    Swal.fire({
      title: 'Select field validation',
      input: 'select',
      inputOptions: {
        Fruits: {
          apples: 'Apples',
          bananas: 'Bananas',
          grapes: 'Grapes',
          oranges: 'Oranges'
        },
        Vegetables: {
          potato: 'Potato',
          broccoli: 'Broccoli',
          carrot: 'Carrot'
        },
        icecream: 'Ice cream'
      },
      inputPlaceholder: 'Select a fruit',
      showCancelButton: true,
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value === 'oranges') {
            resolve('');
          } else {
            resolve('You need to select oranges :)');
          }
        });
      }
    }).then((result) => {
      if (result.value) {
        Swal.fire(`You selected: ${result.value}`);
      }
    });
  }

  radioAlert() {
    const colorOptions = {
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue'
    };
    Swal.fire({
      title: 'Select color',
      input: 'radio',
      inputOptions: colorOptions,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to choose something!';
        } else {
          // Since user chose something, return an empty string (indicates success)
          return '';
        }
      }
    }).then((result) => {
      if (result.value) {
        Swal.fire({ html: `You selected: ${result.value}` });
      }
    });
  }

  checkboxAlert() {
    Swal.fire({
      title: 'Terms and conditions',
      input: 'checkbox',
      inputPlaceholder: `
      I agree with the terms and conditions
    `,
      inputValidator: (result) => {
        if (!result) {
          return 'You need to agree with T&C';
        } else {
          return null;
        }
      }
    }).then((result) => {
      if (result.value) {
        Swal.fire('You agreed with T&C :)');
      }
    });
  }

  fileAlert() {
    Swal.fire({
      title: 'Select image',
      input: 'file',
      inputAttributes: {
        accept: 'image/*',
        'aria-label': 'Upload your profile picture'
      }
    }).then((result) => {
      if (result.value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Ensure imageUrl is always a string
          const imageUrl = e.target?.result?.toString() || '';
          Swal.fire({
            title: 'Your uploaded picture',
            imageUrl: imageUrl,
            imageAlt: 'The uploaded picture'
          });
        };
        reader.readAsDataURL(result.value);
      }
    });
  }

  rangeAlert() {
    Swal.fire({
      title: 'How old are you?',
      icon: 'question',
      input: 'range',
      inputLabel: 'Your age',
      inputAttributes: {
        min: '8',
        max: '120',
        step: '1'
      },
      inputValue: 25
    });
  }
}
