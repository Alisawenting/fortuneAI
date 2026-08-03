Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    showFooter: { type: Boolean, value: false }
  },
  methods: {
    onClose: function () { this.triggerEvent('close'); },
    onConfirm: function () { this.triggerEvent('confirm'); },
    noop: function () {}
  }
});
