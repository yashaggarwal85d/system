export class TextScramble {
  el: HTMLElement;
  chars: string;
  private queue: Array<{
    from: string;
    to: string;
    start: number;
    end: number;
    char?: string;
    color?: string;
  }>;
  private frame: number;
  private frameRequest: number;
  private resolve: (value: void | PromiseLike<void>) => void;
  private spans: HTMLSpanElement[]; // Store references to character spans

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#";
    this.queue = [];
    this.frame = 0;
    this.frameRequest = 0;
    this.resolve = () => {};
    this.spans = []; // Initialize spans array
    this.update = this.update.bind(this);
  }

  getRandomColor() {
    const colors = [
      "#4ADEF6",
      "#00BFFF",
      "#1E90FF",
      "#0000FF",
      "#000080",

      "#FF0000",
      "#DC143C",
      "#B22222",
      "#8B0000",
      "#FF4444",

      "#800080",
      "#8A2BE2",
      "#9400D3",
      "#9932CC",
      "#BA55D3",

      "#00FF00",
      "#32CD32",
      "#228B22",
      "#008000",
      "#50C878",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setText(newText: string) {
    const oldText = this.el.textContent || ""; // Use textContent for consistency
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => (this.resolve = resolve));
    this.queue = [];

    // Clear existing content and prepare spans
    this.el.innerHTML = ""; // Clear previous content
    this.spans = []; // Reset spans array
    for (let i = 0; i < length; i++) {
      const span = document.createElement("span");
      span.textContent = oldText[i] || ""; // Set initial character
      this.el.appendChild(span);
      this.spans.push(span);
    }

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char, color } = this.queue[i];
      const span = this.spans[i];

      if (!span) continue; // Safety check

      if (this.frame >= end) {
        complete++;
        span.textContent = to;
        span.style.color = ""; // Reset color
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          color = this.getRandomColor();
          this.queue[i].char = char;
          this.queue[i].color = color;
        }
        span.textContent = char;
        span.style.color = color || ""; // Apply color
      } else {
        span.textContent = from;
        span.style.color = ""; // Reset color
      }
    }

    // No need to update innerHTML anymore

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}
