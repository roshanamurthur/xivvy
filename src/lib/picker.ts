import * as readline from 'node:readline';
import pc from 'picocolors';

export function pick(items: string[], title: string): Promise<number> {
  const { stdin, stdout } = process;

  // Fallback for non-TTY (piped input)
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      stdout.write(`\n  ${pc.bold(title)}\n\n`);
      for (let i = 0; i < items.length; i++) {
        stdout.write(`  ${pc.cyan(`${i + 1})`)} ${items[i]}\n`);
      }
      stdout.write('\n');

      const rl = readline.createInterface({ input: stdin, output: stdout });
      rl.question(`  ${pc.bold('Pick a number')} [1]: `, (answer) => {
        rl.close();
        const n = parseInt(answer, 10);
        resolve((!isNaN(n) && n >= 1 && n <= items.length ? n : 1) - 1);
      });
    });
  }

  // Interactive arrow-key picker for TTY
  return new Promise((resolve) => {
    let selected = 0;
    let rendered = false;

    const render = () => {
      if (rendered) {
        stdout.write(`\x1b[${items.length}A`);
      }
      for (let i = 0; i < items.length; i++) {
        const prefix = i === selected ? `  ${pc.cyan('❯')} ` : '    ';
        const text = i === selected ? pc.bold(pc.white(items[i])) : pc.dim(items[i]);
        stdout.write(`\x1b[2K${prefix}${text}\n`);
      }
    };

    stdout.write(`\n  ${pc.bold(title)}\n\n`);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    render();
    rendered = true;

    const onData = (key: string) => {
      if (key === '\x1b[A' || key === 'k') {
        selected = (selected - 1 + items.length) % items.length;
        render();
      } else if (key === '\x1b[B' || key === 'j') {
        selected = (selected + 1) % items.length;
        render();
      } else if (key === '\r' || key === '\n') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        resolve(selected);
      } else if (key === '\x03') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdout.write('\n');
        process.exit(0);
      }
    };

    stdin.on('data', onData);
  });
}
