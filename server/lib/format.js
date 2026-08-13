// Shared money formatting so server and admin agree on the same "$ X.XXX" shape.
export function formatPrice(n) {
  if (n === null || n === undefined) return null;
  return '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
