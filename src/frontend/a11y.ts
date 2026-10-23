export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;
  const containerId = priority === 'assertive' ? 'live-assertive' : 'live-polite';
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = '';
    // Small timeout ensures assistive technologies register DOM mutation
    setTimeout(() => {
      container.textContent = message;
    }, 50);
  }
}
