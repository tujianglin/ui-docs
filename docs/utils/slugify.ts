export const slugify = (text: any) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\u4e00-\u9fa5a-z0-9 -]/g, '')
    .replace(/--+/g, '-');
};
