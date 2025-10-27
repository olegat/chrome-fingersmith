// -*- Mode: typescript; compile-command: "ninja" -*-

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------
interface Destroyable {
    destroy(): void;
}

interface DestroyableElement<T extends Element> extends Destroyable {
    el: T;
}

interface SyntheticTouch extends DestroyableElement<HTMLDivElement> {
    touch: Touch;
    isDragging: boolean;
    x: number;
    y: number;
}

class ClearableArray<T extends Destroyable> extends Array<T> {
    clear(): void {
        for (const elem of this) {
            elem.destroy();
        }
        this.length = 0;
    }
}

class UniquePtr<T extends Destroyable> {
    private mPtr: T | undefined;
    public get ptr(): T | undefined {
        return this.mPtr;
    }
    public set ptr(ptr: T | undefined) {
        this.mPtr?.destroy();
        this.mPtr = ptr;
    }
    constructor(ptr?: T) {
        this.mPtr = ptr;
    }
}



//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------
const touches = new ClearableArray<SyntheticTouch>();
let newTouchBtn = new UniquePtr<DestroyableElement<HTMLButtonElement>>();
let moveAllTouches = false;
let lastClientX: number = 0;
let lastClientY: number = 0;



//------------------------------------------------------------------------------
// Utility
//------------------------------------------------------------------------------

// Create a Touch object
function createTouch(target: EventTarget & Element, x: number, y: number, identifier: number): SyntheticTouch {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.background = 'rgba(0, 150, 255, 0.4)';
    el.style.borderRadius = '50%';
    el.style.left = `${x - 15}px`;
    el.style.top = `${y - 15}px`;
    el.style.zIndex = '9999';
    el.style.cursor = 'grab';
    el.style.border = '2px solid rgba(255, 255, 255, 0.9)';
    el.style.boxShadow = `
        0 0 6px rgba(0, 0, 0, 0.6),
        0 0 2px rgba(0, 0, 0, 0.4)
    `;
    el.classList.add('synthetic-touch');
    document.body.appendChild(el);

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

    const onmousedown = (me: MouseEvent) => {
        if (me.detail === 2) return; // Ignore double-click for drag
        if (me.button !== 0) return; // Left-clicks only
        synthetic.isDragging = true;
        lastClientX = me.clientX;
        lastClientY = me.clientY;
        me.preventDefault();
    };

    const ondblclick = () => {
        fireTouchEvent('touchend', [synthetic.touch]);
        const index = touches.findIndex(tc => tc.touch.identifier === synthetic.touch.identifier);
        if (index > -1) touches.splice(index, 1);
        synthetic.destroy();
    };

    const destroy = (): void => {
        el.remove();
        el.removeEventListener('mousedown', onmousedown);
        el.removeEventListener('dblclick', ondblclick);
    }

    el.addEventListener('mousedown', onmousedown);
    el.addEventListener('dblclick', ondblclick);

    const synthetic: SyntheticTouch = { touch, el, isDragging: false, x, y, destroy };
    touches.push(synthetic);
    return synthetic;
}

// Fire a synthetic TouchEvent
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



//------------------------------------------------------------------------------
// Global drag handling
//------------------------------------------------------------------------------
function globMouseMove(me: MouseEvent): void {
    const draggingTouches = touches.filter(t => t.isDragging);
    if (draggingTouches.length === 0) return;

    const moveTargets = moveAllTouches ? touches : draggingTouches;
    const dX = me.clientX - lastClientX;
    const dY = me.clientY - lastClientY;
    moveTargets.forEach(t => {
        t.x += dX;
        t.y += dY;
        t.el.style.left = `${t.x - 15}px`;
        t.el.style.top = `${t.y - 15}px`;

        t.touch = new Touch({
            identifier: t.touch.identifier,
            target: t.touch.target,
            clientX: t.x,
            clientY: t.y,
            pageX: t.x,
            pageY: t.y,
            radiusX: 10,
            radiusY: 10,
            rotationAngle: 0,
            force: 0.5
        });
    });
    lastClientX = me.clientX;
    lastClientY = me.clientY;

    // Fire a combined touchmove for all current touches
    fireTouchEvent('touchmove', touches.map(tc => tc.touch));
}

function globMouseUp(me: MouseEvent): void {
    if (me.button !== 0) return; // Left-clicks only
    touches.forEach(t => t.isDragging = false);
}



//------------------------------------------------------------------------------
// Enable / Disable Extension:
//------------------------------------------------------------------------------
function enableFingersmith(): void {
    if (newTouchBtn.ptr == undefined) {
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

        const onclick = () => {
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
        };
        btn.addEventListener('click', onclick);

        document.addEventListener('mousemove', globMouseMove);
        document.addEventListener('mouseup', globMouseUp);
        newTouchBtn.ptr = {
            el: btn,
            destroy: (): void => {
                btn.remove();
                btn.removeEventListener('click', onclick);
            },
        };
    }
}

function disableFingersmith(): void {
    if (newTouchBtn.ptr) {
        document.removeEventListener('mousemove', globMouseMove);
        document.removeEventListener('mouseup', globMouseUp);
        newTouchBtn.ptr = undefined;
        touches.clear();
    }
}



//------------------------------------------------------------------------------
// Message Handling from Popup
//------------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'enable') enableFingersmith();
    else if (msg.type === 'disable') disableFingersmith();
    else if (msg.type === 'setMoveAll') {
        moveAllTouches = Boolean(msg.value);
        chrome.storage.local.set({ moveAllTouches }); // persist change
    }
});

// Restore settings on load
chrome.storage.local.get(['fingersmithEnabled', 'moveAllTouches'], (result) => {
    if (result['moveAllTouches'] !== undefined)
        moveAllTouches = Boolean(result['moveAllTouches']);
    if (result['fingersmithEnabled'])
        enableFingersmith();
});
