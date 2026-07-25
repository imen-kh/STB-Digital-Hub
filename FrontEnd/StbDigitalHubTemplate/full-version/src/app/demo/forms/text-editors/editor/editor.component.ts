// Angular import
import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormControl, FormGroup } from '@angular/forms';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import jsonDoc from './editor';
import { Validators, Editor, Toolbar, NgxEditorModule } from 'ngx-editor';

@Component({
  selector: 'app-editor',
  imports: [...SHARED_IMPORTS, NgxEditorModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements OnInit, OnDestroy {
  // public props
  editorDoc = jsonDoc;

  editor!: Editor;

  // life cycle event
  ngOnInit(): void {
    this.editor = new Editor();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  // public method
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify']
  ];

  form = new FormGroup({
    editorContent: new FormControl({ value: jsonDoc, disabled: false }, Validators.required())
  });
}
