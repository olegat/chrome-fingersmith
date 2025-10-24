(() => {
  // Store active synthetic touches
  const touches = [];

  // Helper function to create visual circle
  function createTouchVisual(x, y) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.background = 'rgba(0, 150, 255, 0.5)';
    el.style.borderRadius = '50%';
    el.style.left = `${x - 15}px`;
    el.style.top = `${y - 15}px`;
    el.style.zIndex = 9999;
    el.style.cursor = 'grab';
    el.classList.add('synthetic-touch');

    document.body.appendChild(el);
    return el;
  }

  // Generate a Touch object
  function createTouch(target, x, y, identifier) {
    return new Touch({
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
  }

  // Generate a TouchEvent
  function fireTouchEvent(type, touchesArray) {
    const event = new TouchEvent(type, {
      cancelable: true,
      bubbles: true,
      composed: true,
      touches: touchesArray,
      targetTouches: touchesArray,
      changedTouches: touchesArray
    });
    // Dispatch on first target's element
    if (touchesArray.length > 0) touchesArray[0].target.dispatchEvent(event);
  }

  // Add the floating "+☝️" button
  const btn = document.createElement('button');
  btn.innerText = '+☝️';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = 9999;
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

    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = Date.now() + Math.random();
      const touch = createTouch(e.target, e.clientX, e.clientY, id);
      touches.push({ touch, el: createTouchVisual(e.clientX, e.clientY) });

      // Fire synthetic touchstart with all touches
      fireTouchEvent('touchstart', touches.map(t => t.touch));

      // Enable drag/move for visuals
      touches.forEach(t => {
        const el = t.el;
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        el.onmousedown = (me) => {
          if (me.detail === 2) return; // Ignore double-click for drag
          isDragging = true;
          offsetX = me.clientX - el.getBoundingClientRect().left;
          offsetY = me.clientY - el.getBoundingClientRect().top;
          me.preventDefault();
        };

        document.onmousemove = (me) => {
          if (!isDragging) return;
          const x = me.clientX - offsetX + 15;
          const y = me.clientY - offsetY + 15;
          el.style.left = `${x - 15}px`;
          el.style.top = `${y - 15}px`;

          // Update touch coordinates
          t.touch = createTouch(t.touch.target, x, y, t.touch.identifier);
          fireTouchEvent('touchmove', touches.map(t => t.touch));
        };

        document.onmouseup = () => {
          isDragging = false;
        };

        // Double-click for touchend
        el.ondblclick = () => {
          fireTouchEvent('touchend', [t.touch]);
          el.remove();
          const index = touches.findIndex(tc => tc.touch.identifier === t.touch.identifier);
          if (index > -1) touches.splice(index, 1);
        };
      });

      document.body.style.cursor = prevCursor;
      document.removeEventListener('click', clickHandler, true);
    };

    document.addEventListener('click', clickHandler, { capture: true, once: true });
  });
})();
