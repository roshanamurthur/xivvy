const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text: string) {
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${frames[i++ % frames.length]} ${text}`);
  }, 80);

  return {
    update(newText: string) {
      text = newText;
    },
    stop(finalText?: string) {
      clearInterval(id);
      process.stderr.write(`\r\x1b[K${finalText ?? ''}\n`);
    },
  };
}
