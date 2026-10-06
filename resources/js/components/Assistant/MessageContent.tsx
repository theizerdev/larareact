import { Fragment, type ReactNode } from 'react';

/**
 * Renderizador ligero de formato para las respuestas del copiloto.
 * Soporta **negritas**, `código`, viñetas (•, -, 1.), títulos de sección
 * y tarjetas clave/valor (• **Etiqueta:** valor). No usa dangerouslySetInnerHTML.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;
const BULLET_PATTERN = /^\s*(?:[•\-]|\d+[.)])\s+(.*)$/;
const KV_PATTERN = /^\s*(?:[•\-]\s+)\*\*([^*:]+):\*\*\s*(.+)$/;
const HEADING_PATTERN = /^\s*(?:\S{1,4}\s)?\*\*[^*]+\*\*:?\s*$/;

type Block =
    | { kind: 'heading'; text: string }
    | { kind: 'paragraph'; text: string }
    | { kind: 'list'; items: string[] }
    | { kind: 'kv'; rows: Array<[string, string]> }
    | { kind: 'gap' };

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    return text
        .split(INLINE_PATTERN)
        .filter((part) => part !== '')
        .map((part, index) => {
            const key = `${keyPrefix}-${index}`;
            if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={key} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code
                        key={key}
                        className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return <Fragment key={key}>{part}</Fragment>;
        });
}

function parseBlocks(text: string): Block[] {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        if (line.trim() === '') {
            if (blocks.length > 0 && blocks[blocks.length - 1].kind !== 'gap') {
                blocks.push({ kind: 'gap' });
            }
            index++;
            continue;
        }

        if (BULLET_PATTERN.test(line)) {
            const group: string[] = [];
            while (index < lines.length && BULLET_PATTERN.test(lines[index])) {
                group.push(lines[index]);
                index++;
            }

            const allKeyValue = group.length >= 2 && group.every((item) => KV_PATTERN.test(item));
            if (allKeyValue) {
                blocks.push({
                    kind: 'kv',
                    rows: group.map((item) => {
                        const match = item.match(KV_PATTERN)!;
                        return [match[1].trim(), match[2].trim()] as [string, string];
                    }),
                });
            } else {
                blocks.push({
                    kind: 'list',
                    items: group.map((item) => item.match(BULLET_PATTERN)![1]),
                });
            }
            continue;
        }

        if (HEADING_PATTERN.test(line)) {
            blocks.push({ kind: 'heading', text: line.trim() });
            index++;
            continue;
        }

        blocks.push({ kind: 'paragraph', text: line });
        index++;
    }

    while (blocks.length > 0 && blocks[blocks.length - 1].kind === 'gap') {
        blocks.pop();
    }

    return blocks;
}

export default function MessageContent({ text }: { text: string }) {
    const blocks = parseBlocks(text);

    return (
        <div className="space-y-1.5 break-words">
            {blocks.map((block, i) => {
                const key = `b-${i}`;

                switch (block.kind) {
                    case 'gap':
                        return <div key={key} className="h-1" />;

                    case 'heading':
                        return (
                            <div key={key} className="pt-1 text-[12px] font-semibold text-foreground">
                                {renderInline(block.text, key)}
                            </div>
                        );

                    case 'paragraph':
                        return <p key={key}>{renderInline(block.text, key)}</p>;

                    case 'list':
                        return (
                            <ul key={key} className="space-y-1">
                                {block.items.map((item, itemIndex) => (
                                    <li key={`${key}-${itemIndex}`} className="flex gap-2">
                                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                                        <span className="min-w-0 flex-1">{renderInline(item, `${key}-${itemIndex}`)}</span>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'kv':
                        return (
                            <dl
                                key={key}
                                className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-background/60"
                            >
                                {block.rows.map(([label, value], rowIndex) => (
                                    <div
                                        key={`${key}-${rowIndex}`}
                                        className="flex items-baseline justify-between gap-3 px-3 py-1.5"
                                    >
                                        <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="min-w-0 text-right text-[11.5px] font-medium text-foreground">
                                            {renderInline(value, `${key}-${rowIndex}`)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        );
                }
            })}
        </div>
    );
}
