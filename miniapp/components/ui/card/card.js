Component({
  properties: {
    padding: { type: String, value: 'p-lg' },
    customStyle: { type: String, value: '' }
  },
  observers: {
    padding: function (val) {
      this.setData({ paddingClass: val || 'p-lg' });
    }
  },
  data: {
    paddingClass: 'p-lg'
  },
  attached: function () {
    this.setData({ paddingClass: this.properties.padding || 'p-lg' });
  }
});
