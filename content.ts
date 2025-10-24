// -*- Mode: typescript; compile-command: "ninja" -*-
interface SyntheticTouch {
    touch: Touch;
    el: HTMLDivElement;
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
}

const touches: SyntheticTouch[] = [];

// Helper: create visual circle for a synthetic touch
function createTouchVisual(x: number, y: number): HTMLDivElement {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.background = 'rgba(0, 150, 255, 0.5)';
    el.style.borderRadius = '50%';
    el.style.left = `${x - 15}px`;
    el.style.top = `${y - 15}px`;
    el.style.zIndex = '9999';
    el.style.cursor = 'grab';
    el.classList.add('synthetic-touch');
    document.body.appendChild(el);
    return el;
}

// Helper: generate a Touch object
function createTouch(target: EventTarget & Element, x: number, y: number, identifier: number): SyntheticTouch {
    const el = createTouchVisual(x, y);
    const touch: Touch = new Touch({
        identifier,
        target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        radiusX: 10,
        radiusY: 10,
        rotationAngle: 0,
        force: 0.5
    });

    const synthetic: SyntheticTouch = { touch, el, isDragging: false, offsetX: 0, offsetY: 0 };
    touches.push(synthetic);

    // Mouse down for dragging
    el.addEventListener('mousedown', (me: MouseEvent) => {
        if (me.detail === 2) return; // Ignore double-click for drag
        synthetic.isDragging = true;
        synthetic.offsetX = me.clientX - el.getBoundingClientRect().left;
        synthetic.offsetY = me.clientY - el.getBoundingClientRect().top;
        me.preventDefault();
    });

    // Double-click to remove touch
    el.addEventListener('dblclick', () => {
        fireTouchEvent('touchend', [synthetic.touch]);
        el.remove();
        const index = touches.findIndex(tc => tc.touch.identifier === synthetic.touch.identifier);
        if (index > -1) touches.splice(index, 1);
    });

    return synthetic;
}

// Helper: fire a synthetic TouchEvent
function fireTouchEvent(type: string, touchesArray: Touch[]): void {
    if (touchesArray.length === 0) return;
    const event = new TouchEvent(type, {
        cancelable: true,
        bubbles: true,
        composed: true,
        touches: touchesArray,
        targetTouches: touchesArray,
        changedTouches: touchesArray
    });
    touchesArray[0]!.target.dispatchEvent(event);
}

// Global drag handling
document.addEventListener('mousemove', (me: MouseEvent) => {
    touches.forEach(t => {
        if (!t.isDragging) return;
        const x = me.clientX - t.offsetX + 15;
        const y = me.clientY - t.offsetY + 15;
        t.el.style.left = `${x - 15}px`;
        t.el.style.top = `${y - 15}px`;

        t.touch = new Touch({
            identifier: t.touch.identifier,
            target: t.touch.target,
            clientX: x,
            clientY: y,
            pageX: x,
            pageY: y,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 0.5
        });

        fireTouchEvent('touchmove', touches.map(tc => tc.touch));
    });
});

document.addEventListener('mouseup', () => {
    touches.forEach(t => t.isDragging = false);
});

// Add the floating "+☝️" button
const btn = document.createElement('button');
btn.innerText = '+☝️';
btn.style.position = 'fixed';
btn.style.bottom = '20px';
btn.style.right = '20px';
btn.style.zIndex = '9999';
btn.style.fontSize = '20px';
btn.style.padding = '10px';
btn.style.cursor = 'pointer';
btn.style.background = '#0af';
btn.style.color = 'white';
btn.style.border = 'none';
btn.style.borderRadius = '5px';
btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
document.body.appendChild(btn);

btn.addEventListener('click', () => {
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'pointer';

    const clickHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as Element;
        const id = Date.now() + Math.random();
        createTouch(target, e.clientX, e.clientY, id);

        fireTouchEvent('touchstart', touches.map(t => t.touch));

        document.body.style.cursor = prevCursor;
        document.removeEventListener('click', clickHandler, true);
    };

    window.addEventListener('click', clickHandler, { capture: true, once: true });
});
