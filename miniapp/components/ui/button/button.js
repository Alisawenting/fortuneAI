Component({
  properties: {
    variant: { type: String, value: 'primary' },
    size: { type: String, value: 'md' },
    full: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    customStyle: { type: String, value: '' }
  },
  methods: {
    onTap: function () {
      if (!this.properties.disabled && !this.properties.loading) {
        this.triggerEvent('click');
      }
    }
  }
});
