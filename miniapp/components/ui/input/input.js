Component({
  properties: {
    label: { type: String, value: '' },
    value: { type: String, value: '' },
    placeholder: { type: String, value: '' },
    type: { type: String, value: 'text' },
    password: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    focus: { type: Boolean, value: false },
    maxlength: { type: Number, value: 140 },
    error: { type: String, value: '' }
  },
  methods: {
    onInput: function (e) { this.triggerEvent('change', e.detail); },
    onFocus: function () { this.triggerEvent('focus'); },
    onBlur: function () { this.triggerEvent('blur'); },
    onConfirm: function (e) { this.triggerEvent('confirm', e.detail); }
  }
});
