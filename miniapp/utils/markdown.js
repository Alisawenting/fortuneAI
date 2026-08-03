/**
 * 简易 Markdown → rich-text nodes 转换
 * 微信 rich-text 支持的标签: a, abbr, b, blockquote, br, code, col, colgroup, dd, del, div, dl, dt, em, fieldset, h1-h6, hr, i, img, ins, label, legend, li, ol, p, q, span, strong, sub, sup, table, tbody, td, tfoot, th, thead, tr, ul
 */

function parseMarkdown(text) {
  if (!text) return [];
  var result = [];
  var lines = text.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (!line.trim()) {
      if (result.length > 0) {
        result.push({
          name: 'p',
          attrs: { style: 'height:12rpx' },
          children: []
        });
      }
      continue;
    }

    // 处理加粗 **text**
    var children = parseInlineMarkdown(line);

    result.push({
      name: 'p',
      attrs: { style: 'line-height:2;margin-bottom:12rpx;font-size:28rpx;color:#374151' },
      children: children
    });
  }

  return result;
}

/**
 * 解析行内 markdown 元素
 */
function parseInlineMarkdown(text) {
  var children = [];
  var remaining = text;

  while (remaining.length > 0) {
    var boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
    if (boldMatch) {
      // 加粗之前的文本
      if (boldMatch[1]) {
        children.push({ type: 'text', text: boldMatch[1] });
      }
      // 加粗文本
      children.push({
        name: 'span',
        attrs: { style: 'font-weight:bold;color:#1f2937' },
        children: [{ type: 'text', text: boldMatch[2] }]
      });
      remaining = remaining.slice(boldMatch[0].length);
    } else {
      // 无更多加粗，剩余全部为纯文本
      children.push({ type: 'text', text: remaining });
      break;
    }
  }

  return children;
}

/**
 * 返回纯文本（用于预览），去除 markdown 标记
 */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n{2,}/g, '，')
    .replace(/\n/g, '，')
    .trim();
}

module.exports = {
  parseMarkdown: parseMarkdown,
  parseInlineMarkdown: parseInlineMarkdown,
  stripMarkdown: stripMarkdown
};
