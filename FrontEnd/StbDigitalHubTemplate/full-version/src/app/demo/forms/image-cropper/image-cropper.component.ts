// angular import
import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { Dimensions, ImageCroppedEvent, ImageTransform } from './img-config/interfaces';
import { CropperComponentComponent } from './img-config/cropper-component/cropper-component.component';

@Component({
  selector: 'app-image-cropper',
  imports: [...SHARED_IMPORTS, CropperComponentComponent],
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.scss'
})
export class ImageCropperComponent {
  private sanitizer = inject(DomSanitizer);

  // public props
  imageChangedEvent = '';
  // eslint-disable-next-line
  croppedImage!: any;
  canvasRotation = 0;
  rotation?: number;
  translateH = 0;
  translateV = 0;
  scale = 1;
  aspectRatio = 4 / 3;
  showCropper = false;
  containWithinAspectRatio = false;
  transform: ImageTransform = {
    translateUnit: 'px'
  };
  imageURL?: string = 'assets/images/application/prod-img-3.jpg';
  loading = false;
  allowMoveImage = false;
  hidden = false;

  fileChangeEvent(event: string): void {
    this.loading = true;
    this.imageChangedEvent = event;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
  }

  imageLoaded() {
    this.showCropper = true;
  }

  cropperReady(sourceImageDimensions: Dimensions) {
    console.log('Cropper ready', sourceImageDimensions);
    this.loading = false;
  }

  loadImageFailed() {}

  rotateLeft() {
    this.loading = true;
    setTimeout(() => {
      // Use timeout because rotating image is a heavy operation and will block the ui thread
      this.canvasRotation--;
      this.flipAfterRotate();
    });
  }

  rotateRight() {
    this.loading = true;
    setTimeout(() => {
      this.canvasRotation++;
      this.flipAfterRotate();
    });
  }

  moveLeft() {
    this.transform = {
      ...this.transform,
      translateH: ++this.translateH
    };
  }

  moveRight() {
    this.transform = {
      ...this.transform,
      translateH: --this.translateH
    };
  }

  moveTop() {
    this.transform = {
      ...this.transform,
      translateV: ++this.translateV
    };
  }

  moveBottom() {
    this.transform = {
      ...this.transform,
      translateV: --this.translateV
    };
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH
    };
    this.translateH = 0;
    this.translateV = 0;
  }

  flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH
    };
  }

  flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV
    };
  }

  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {
      translateUnit: 'px'
    };
  }

  zoomOut() {
    this.scale -= 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  zoomIn() {
    this.scale += 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  toggleContainWithinAspectRatio() {
    this.containWithinAspectRatio = !this.containWithinAspectRatio;
  }

  updateRotation() {
    this.transform = {
      ...this.transform,
      rotate: this.rotation
    };
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }
}
