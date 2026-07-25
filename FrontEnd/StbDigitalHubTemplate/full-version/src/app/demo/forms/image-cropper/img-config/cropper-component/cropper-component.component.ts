import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  effect,
  viewChild,
  inject,
  AfterViewInit
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeUrl } from '@angular/platform-browser';
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform, LoadedImage, MoveStart } from '../interfaces';
import { OutputFormat, OutputType } from '../interfaces/cropper-options.interface';
import { CropperSettings } from '../interfaces/cropper.settings';
import { MoveTypes } from '../interfaces/move-start.interface';
import { CropService } from '../services/crop.service';
import { CropperPositionService } from '../services/cropper-position.service';
import { LoadImageService } from '../services/load-image.service';
import { HammerStatic } from '../utils/hammer.utils';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
import { first, fromEvent, merge, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cropper-component',
  imports: [],
  templateUrl: './cropper-component.component.html',
  styleUrl: './cropper-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '[style.text-align]': 'alignImage()',
    '[class.disabled]': 'disabled()',
    '[class.ngx-ix-hidden]': 'hidden()'
  }
})
export class CropperComponentComponent implements OnChanges, OnInit, AfterViewInit {
  private cropService = inject(CropService);
  private cropperPositionService = inject(CropperPositionService);
  private loadImageService = inject(LoadImageService);
  private sanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);

  private settings = new CropperSettings();
  private setImageMaxSizeRetries = 0;
  private moveStart?: MoveStart;
  private loadedImage?: LoadedImage;
  private resizedWhileHidden = false;

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  maxSize: Dimensions = {
    width: 0,
    height: 0
  };
  moveTypes = MoveTypes;
  imageVisible = false;

  readonly wrapper = viewChild<ElementRef<HTMLDivElement>>('wrapper');
  readonly sourceImage = viewChild<ElementRef<HTMLImageElement>>('sourceImage');

  // eslint-disable-next-line
  readonly imageChangedEvent = input<any>();
  readonly imageURL = input<string>();
  readonly imageBase64 = input<string>();
  readonly imageFile = input<File>();
  readonly imageAltText = input<string>();
  readonly cropperFrameAriaLabel = input(this.settings.cropperFrameAriaLabel);
  readonly output = input<'blob' | 'base64'>(this.settings.output);
  readonly format = input<OutputFormat>(this.settings.format);
  readonly transform = input<ImageTransform>({});
  transformValue: ImageTransform = {};
  readonly maintainAspectRatio = input(this.settings.maintainAspectRatio);
  readonly aspectRatio = input(this.settings.aspectRatio);
  readonly resetCropOnAspectRatioChange = input(this.settings.resetCropOnAspectRatioChange);
  readonly resizeToWidth = input(this.settings.resizeToWidth);
  readonly resizeToHeight = input(this.settings.resizeToHeight);
  readonly cropperMinWidth = input(this.settings.cropperMinWidth);
  readonly cropperMinHeight = input(this.settings.cropperMinHeight);
  readonly cropperMaxHeight = input(this.settings.cropperMaxHeight);
  readonly cropperMaxWidth = input(this.settings.cropperMaxWidth);
  readonly cropperStaticWidth = input(this.settings.cropperStaticWidth);
  readonly cropperStaticHeight = input(this.settings.cropperStaticHeight);
  readonly canvasRotation = input(this.settings.canvasRotation);
  readonly initialStepSize = input(this.settings.initialStepSize);
  readonly roundCropper = input(this.settings.roundCropper);
  readonly onlyScaleDown = input(this.settings.onlyScaleDown);
  readonly imageQuality = input(this.settings.imageQuality);
  readonly autoCrop = input(this.settings.autoCrop);
  readonly backgroundColor = input(this.settings.backgroundColor);
  readonly containWithinAspectRatio = input(this.settings.containWithinAspectRatio);
  readonly hideResizeSquares = input(this.settings.hideResizeSquares);
  readonly allowMoveImage = input(false);
  readonly cropper = input<CropperPosition>({
    x1: -100,
    y1: -100,
    x2: 10000,
    y2: 10000
  });
  readonly alignImage = input<'left' | 'center'>(this.settings.alignImage);
  readonly disabled = input(false);
  readonly hidden = input(false);

  readonly imageCropped = output<ImageCroppedEvent>();
  readonly startCropImage = output<void>();
  readonly imageLoaded = output<LoadedImage>();
  readonly cropperReady = output<Dimensions>();
  readonly loadImageFailed = output<void>();
  readonly transformChange = output<ImageTransform>();

  constructor() {
    this.reset();
    effect(() => {
      this.transformValue = { ...this.transform() };
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.onChangesUpdateSettings(changes);
    this.onChangesInputImage(changes);

    if (this.loadedImage?.original.image.complete && (changes['containWithinAspectRatio'] || changes['canvasRotation'])) {
      this.loadImageService
        .transformLoadedImage(this.loadedImage, this.settings)
        .then((res) => this.setLoadedImage(res))
        .catch((err) => this.loadImageError(err));
    }
    if (changes['cropper'] || changes['maintainAspectRatio'] || changes['aspectRatio']) {
      if (this.sourceImage()) {
        this.setMaxSize();
      }
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      if (
        this.maintainAspectRatio() &&
        (this.resetCropOnAspectRatioChange() || !this.aspectRatioIsCorrect()) &&
        (changes['maintainAspectRatio'] || changes['aspectRatio'])
      ) {
        this.resetCropperPosition();
      } else if (changes['cropper']) {
        this.checkCropperPosition(false);
        this.doAutoCrop();
      }
      this.cd.markForCheck();
    }
    if (changes['transform']) {
      this.transformValue = this.transformValue || {};
      this.setCssTransform();
      this.doAutoCrop();
      this.cd.markForCheck();
    }
    if (changes['hidden'] && this.resizedWhileHidden && !this.hidden()) {
      setTimeout(() => {
        this.onResize();
        this.resizedWhileHidden = false;
      });
    }
  }

  private onChangesUpdateSettings(changes: SimpleChanges) {
    this.settings.setOptionsFromChanges(changes);

    if (this.settings.cropperStaticHeight && this.settings.cropperStaticWidth) {
      this.settings.setOptions({
        hideResizeSquares: true,
        cropperMinWidth: this.settings.cropperStaticWidth,
        cropperMinHeight: this.settings.cropperStaticHeight,
        cropperMaxHeight: this.settings.cropperStaticHeight,
        cropperMaxWidth: this.settings.cropperStaticWidth,
        maintainAspectRatio: false
      });
    }
  }

  private onChangesInputImage(changes: SimpleChanges): void {
    if (changes['imageChangedEvent'] || changes['imageURL'] || changes['imageBase64'] || changes['imageFile']) {
      this.reset();
    }
    if (changes['imageChangedEvent'] && this.isValidImageChangedEvent()) {
      this.loadImageFile(this.imageChangedEvent().target.files[0]);
    }
    const imageURL = this.imageURL();
    if (changes['imageURL'] && imageURL) {
      this.loadImageFromURL(imageURL);
    }
    const imageBase64 = this.imageBase64();
    if (changes['imageBase64'] && imageBase64) {
      this.loadBase64Image(imageBase64);
    }
    const imageFile = this.imageFile();
    if (changes['imageFile'] && imageFile) {
      this.loadImageFile(imageFile);
    }
  }

  private isValidImageChangedEvent(): boolean {
    return this.imageChangedEvent()?.target?.files?.length > 0;
  }

  private setCssTransform() {
    const translateUnit = this.transformValue?.translateUnit || '%';
    this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle(
      `translate(${this.transformValue.translateH || 0}${translateUnit}, ${this.transformValue.translateV || 0}${translateUnit})` +
        ' scaleX(' +
        (this.transformValue.scale || 1) * (this.transformValue.flipH ? -1 : 1) +
        ')' +
        ' scaleY(' +
        (this.transformValue.scale || 1) * (this.transformValue.flipV ? -1 : 1) +
        ')' +
        ' rotate(' +
        (this.transformValue.rotate || 0) +
        'deg)'
    );
  }

  ngOnInit(): void {
    this.settings.stepSize = this.initialStepSize();
    this.activatePinchGesture();
  }

  private reset(): void {
    this.imageVisible = false;
    this.loadedImage = undefined;
    this.safeImgDataUrl =
      'data:image/png;base64,iVBORw0KGg' + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU' + 'AAarVyFEAAAAASUVORK5CYII=';
    this.moveStart = {
      active: false,
      type: null,
      position: null,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      clientX: 0,
      clientY: 0
    };
    this.maxSize = {
      width: 0,
      height: 0
    };
    const cropper = this.cropper();
    cropper.x1 = -100;
    cropper.y1 = -100;
    cropper.x2 = 10000;
    cropper.y2 = 10000;
  }

  private loadImageFile(file: File): void {
    this.loadImageService
      .loadImageFile(file, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadBase64Image(imageBase64: string): void {
    this.loadImageService
      .loadBase64Image(imageBase64, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private loadImageFromURL(url: string): void {
    this.loadImageService
      .loadImageFromURL(url, this.settings)
      .then((res) => this.setLoadedImage(res))
      .catch((err) => this.loadImageError(err));
  }

  private setLoadedImage(loadedImage: LoadedImage): void {
    this.loadedImage = loadedImage;
    this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.objectUrl);
    this.cd.markForCheck();
  }

  loadImageError(error: string): void {
    console.error(error);
    this.loadImageFailed.emit();
  }

  imageLoadedInView(): void {
    if (this.loadedImage != null) {
      this.imageLoaded.emit(this.loadedImage);
      this.setImageMaxSizeRetries = 0;
      setTimeout(() => this.checkImageMaxSizeRecursively());
    }
  }

  private checkImageMaxSizeRecursively(): void {
    if (this.setImageMaxSizeRetries > 40) {
      this.loadImageFailed.emit();
    } else if (this.sourceImageLoaded()) {
      this.setMaxSize();
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
      this.resetCropperPosition();
      this.cropperReady.emit({ ...this.maxSize });
      this.cd.markForCheck();
    } else {
      this.setImageMaxSizeRetries++;
      setTimeout(() => this.checkImageMaxSizeRecursively(), 50);
    }
  }

  private sourceImageLoaded(): boolean {
    const sourceImage = this.sourceImage();
    return (sourceImage?.nativeElement?.offsetWidth ?? 0) > 0;
  }

  onResize(): void {
    if (!this.loadedImage) {
      return;
    }
    if (this.hidden()) {
      this.resizedWhileHidden = true;
    } else {
      const oldMaxSize = { ...this.maxSize };
      this.setMaxSize();
      this.resizeCropperPosition(oldMaxSize);
      this.setCropperScaledMinSize();
      this.setCropperScaledMaxSize();
    }
  }

  private async activatePinchGesture() {
    // HammerJS integration is removed in Angular 22.
    // You may need to implement custom gesture logic or use a modern library.
    const Hammer = (window as unknown as Window & { Hammer?: HammerStatic })?.['Hammer'] || null;

    if (Hammer) {
      const wrapperEl = this.wrapper();
      if (wrapperEl) {
        const hammer = new Hammer(wrapperEl.nativeElement);
        hammer.get('pinch').set({ enable: true });
        hammer.on('pinchmove', this.onPinch.bind(this));
        hammer.on('pinchend', this.pinchStop.bind(this));
        hammer.on('pinchstart', this.startPinch.bind(this));
      }
    }
  }

  private resizeCropperPosition(oldMaxSize: Dimensions): void {
    if (oldMaxSize.width !== this.maxSize.width || oldMaxSize.height !== this.maxSize.height) {
      const cropper = this.cropper();
      cropper.x1 = (cropper.x1 * this.maxSize.width) / oldMaxSize.width;
      cropper.x2 = (cropper.x2 * this.maxSize.width) / oldMaxSize.width;
      cropper.y1 = (cropper.y1 * this.maxSize.height) / oldMaxSize.height;
      cropper.y2 = (cropper.y2 * this.maxSize.height) / oldMaxSize.height;
    }
  }

  resetCropperPosition(): void {
    this.cropperPositionService.resetCropperPosition(this.sourceImage(), this.cropper(), this.settings, this.maxSize);
    this.doAutoCrop();
    this.imageVisible = true;
  }

  keyboardAccess(event: KeyboardEvent) {
    this.changeKeyboardStepSize(event);
    this.keyboardMoveCropper(event);
  }

  private changeKeyboardStepSize(event: KeyboardEvent): void {
    const key = +event.key;
    if (key >= 1 && key <= 9) {
      this.settings.stepSize = key;
    }
  }

  private keyboardMoveCropper(event: KeyboardEvent) {
    const keyboardWhiteList: string[] = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'];
    if (!keyboardWhiteList.includes(event.key)) {
      return;
    }
    const moveType = event.shiftKey ? MoveTypes.Resize : MoveTypes.Move;
    const position = event.altKey ? getInvertedPositionForKey(event.key) : getPositionForKey(event.key);
    const moveEvent = getEventForKey(event.key, this.settings.stepSize);
    event.preventDefault();
    event.stopPropagation();
    this.startMove({ clientX: 0, clientY: 0 }, moveType, position);
    this.handleMouseMove(moveEvent);
    this.handleMouseUp();
  }

  startMove(
    // eslint-disable-next-line
    event: { clientX?: number; clientY?: number; preventDefault?: any },
    moveType: MoveTypes,
    position: string | null = null
  ): void {
    if (
      this.disabled() ||
      (this.moveStart?.active && this.moveStart?.type === MoveTypes.Pinch) ||
      (moveType === MoveTypes.Drag && !this.allowMoveImage())
    ) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: moveType,
      position,
      transform: { ...this.transformValue },
      clientX: this.cropperPositionService.getClientX(event),
      clientY: this.cropperPositionService.getClientY(event),
      ...this.cropper()
    };
    this.initMouseMove();
  }

  private initMouseMove(): void {
    merge(fromEvent(document, 'mousemove'), fromEvent(document, 'touchmove'))
      .pipe(takeUntil(merge(fromEvent(document, 'mouseup'), fromEvent(document, 'touchend')).pipe(first())))
      .subscribe({
        next: (event) => this.handleMouseMove(event),
        complete: () => this.handleMouseUp()
      });
  }

  startPinch(event: { preventDefault: () => void }) {
    if (!this.safeImgDataUrl) {
      return;
    }
    if (event.preventDefault) {
      event.preventDefault();
    }
    this.moveStart = {
      active: true,
      type: MoveTypes.Pinch,
      position: 'center',
      clientX: this.cropper().x1 + (this.cropper().x2 - this.cropper().x1) / 2,
      clientY: this.cropper().y1 + (this.cropper().y2 - this.cropper().y1) / 2,
      ...this.cropper()
    };
  }

  private handleMouseMove(event: Event): void {
    if (this.moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Move) {
        this.cropperPositionService.move(event, this.moveStart!, this.cropper());
        this.checkCropperPosition(true);
      } else if (this.moveStart!.type === MoveTypes.Resize) {
        if (!this.cropperStaticWidth() && !this.cropperStaticHeight()) {
          this.cropperPositionService.resize(event, this.moveStart!, this.cropper(), this.maxSize, this.settings);
        }
        this.checkCropperPosition(false);
      } else if (this.moveStart!.type === MoveTypes.Drag) {
        const diffX = this.cropperPositionService.getClientX(event) - this.moveStart!.clientX;
        const diffY = this.cropperPositionService.getClientY(event) - this.moveStart!.clientY;
        this.transformValue = {
          ...this.transformValue,
          translateH: (this.moveStart!.transform?.translateH || 0) + diffX,
          translateV: (this.moveStart!.transform?.translateV || 0) + diffY
        };
        this.setCssTransform();
      }
      this.cd.markForCheck();
    }
  }

  // eslint-disable-next-line
  onPinch(event: any) {
    if (this.moveStart!.active) {
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (this.moveStart!.type === MoveTypes.Pinch) {
        this.cropperPositionService.resize(event, this.moveStart!, this.cropper(), this.maxSize, this.settings);
        this.checkCropperPosition(false);
      }
      this.cd.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.checkImageMaxSizeRecursively();
  }

  private setMaxSize(): void {
    const sourceImage = this.sourceImage();

    // ✅ extra safety (important)
    if (!sourceImage || !sourceImage.nativeElement) {
      return;
    }

    if (sourceImage.nativeElement.offsetWidth <= 0) {
      return;
    }

    const sourceImageStyle = getComputedStyle(sourceImage.nativeElement);
    this.maxSize.width = parseFloat(sourceImageStyle.width);
    this.maxSize.height = parseFloat(sourceImageStyle.height);

    this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
  }
  private setCropperScaledMinSize(): void {
    if (this.loadedImage?.transformed?.image) {
      this.setCropperScaledMinWidth();
      this.setCropperScaledMinHeight();
    } else {
      this.settings.cropperScaledMinWidth = 20;
      this.settings.cropperScaledMinHeight = 20;
    }
  }

  private setCropperScaledMinWidth(): void {
    this.settings.cropperScaledMinWidth =
      this.cropperMinWidth() > 0
        ? Math.max(20, (this.cropperMinWidth() / this.loadedImage!.transformed.image.width) * this.maxSize.width)
        : 20;
  }

  private setCropperScaledMinHeight(): void {
    if (this.maintainAspectRatio()) {
      this.settings.cropperScaledMinHeight = Math.max(20, this.settings.cropperScaledMinWidth / this.aspectRatio());
    } else if (this.cropperMinHeight() > 0) {
      this.settings.cropperScaledMinHeight = Math.max(
        20,
        (this.cropperMinHeight() / this.loadedImage!.transformed.image.height) * this.maxSize.height
      );
    } else {
      this.settings.cropperScaledMinHeight = 20;
    }
  }

  private setCropperScaledMaxSize(): void {
    if (this.loadedImage?.transformed?.image) {
      const ratio = this.loadedImage.transformed.size.width / this.maxSize.width;
      this.settings.cropperScaledMaxWidth = this.cropperMaxWidth() > 20 ? this.cropperMaxWidth() / ratio : this.maxSize.width;
      this.settings.cropperScaledMaxHeight = this.cropperMaxHeight() > 20 ? this.cropperMaxHeight() / ratio : this.maxSize.height;
      if (this.maintainAspectRatio()) {
        if (this.settings.cropperScaledMaxWidth > this.settings.cropperScaledMaxHeight * this.aspectRatio()) {
          this.settings.cropperScaledMaxWidth = this.settings.cropperScaledMaxHeight * this.aspectRatio();
        } else if (this.settings.cropperScaledMaxWidth < this.settings.cropperScaledMaxHeight * this.aspectRatio()) {
          this.settings.cropperScaledMaxHeight = this.settings.cropperScaledMaxWidth / this.aspectRatio();
        }
      }
    } else {
      this.settings.cropperScaledMaxWidth = this.maxSize.width;
      this.settings.cropperScaledMaxHeight = this.maxSize.height;
    }
  }

  private checkCropperPosition(maintainSize = false): void {
    const cropper = this.cropper();
    if (this.cropper().x1 < 0) {
      const cropper = this.cropper();
      cropper.x2 -= maintainSize ? cropper.x1 : 0;
      cropper.x1 = 0;
    }
    if (cropper.y1 < 0) {
      cropper.y2 -= maintainSize ? cropper.y1 : 0;
      cropper.y1 = 0;
    }
    if (cropper.x2 > this.maxSize.width) {
      cropper.x1 -= maintainSize ? cropper.x2 - this.maxSize.width : 0;
      cropper.x2 = this.maxSize.width;
    }
    if (cropper.y2 > this.maxSize.height) {
      cropper.y1 -= maintainSize ? cropper.y2 - this.maxSize.height : 0;
      cropper.y2 = this.maxSize.height;
    }
  }

  private handleMouseUp(): void {
    if (this.moveStart!.active) {
      this.moveStart!.active = false;
      if (this.moveStart?.type === MoveTypes.Drag) {
        this.transformChange.emit(this.transformValue);
      } else {
        this.doAutoCrop();
      }
    }
  }

  pinchStop(): void {
    if (this.moveStart!.active) {
      this.moveStart!.active = false;
      this.doAutoCrop();
    }
  }

  private doAutoCrop(): void {
    if (this.autoCrop()) {
      void this.crop();
    }
  }

  crop(): ImageCroppedEvent | null;
  crop(output: 'base64'): ImageCroppedEvent | null;
  crop(output: 'blob'): Promise<ImageCroppedEvent> | null;
  crop(output: OutputType = this.settings.output): Promise<ImageCroppedEvent> | ImageCroppedEvent | null {
    if (this.loadedImage?.transformed?.image != null) {
      this.startCropImage.emit();
      if (output === 'blob') {
        return this.cropToBlob();
      } else if (output === 'base64') {
        return this.cropToBase64();
      }
    }
    return null;
  }

  private cropToBlob(): Promise<ImageCroppedEvent> | null {
    const result = this.cropService.crop(this.loadedImage!, this.cropper(), this.settings, 'blob', this.maxSize);
    if (result) {
      return Promise.resolve(result).then((output) => {
        console.log('CROP');
        this.imageCropped.emit(output);
        return result;
      });
    }
    return null;
  }

  private cropToBase64(): ImageCroppedEvent | null {
    const result = this.cropService.crop(this.loadedImage!, this.cropper(), this.settings, 'base64', this.maxSize);
    if (result) {
      this.imageCropped.emit(result);
      return result;
    }
    return null;
  }

  private aspectRatioIsCorrect(): boolean {
    const currentCropAspectRatio = (this.cropper().x2 - this.cropper().x1) / (this.cropper().y2 - this.cropper().y1);
    return currentCropAspectRatio === this.aspectRatio();
  }
}
