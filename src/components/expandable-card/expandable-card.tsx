import { Component, Element, Listen, Prop, State } from '@stencil/core';
import { RenderStatus } from '../../utils/render-status';
import { MDCRipple } from '@material/ripple';

@Component({
  tag: 'rula-expandable-card',
  styleUrl: 'expandable-card.scss',
  host: {
    theme: ''
  }
})

export class ExpandableCard {
  @Prop() delay: number;
  @State() open: boolean;

  @Element() root: HTMLElement;

  scrim: HTMLElement;
  wrapper: HTMLElement;

  firstTabStop: HTMLElement;
  lastTabStop: HTMLElement;

  oldTabStop: HTMLElement;

  render() {
    return ([
      <div id="scrim"
          onClick={() => this.close_()}
          onScroll={e => e.preventDefault()}></div>,
      <div id="wrapper"
          onClick={() => this.toggle_()}>
        <slot />
      </div>
    ]);
  }

  componentWillLoad() {
  }

  componentDidLoad() {
    this.scrim = this.root.querySelector('#scrim');
    this.wrapper = this.root.querySelector('#wrapper');

    this.scrim.setAttribute('hidden', '');

    // Add opacity transition to the content element.
    const content:HTMLElement = this.root.querySelector('[extra-content]');
    content.style.transitionDuration = '0.2s';
    content.style.transitionDelay = '0.1s';
    content.style.transitionProperty = 'opacity';

    RenderStatus.afterNextRender(this, () => {
      this.wrapper.style.top = '0';
      this.wrapper.style.left = '0';
      this.wrapper.style.width = '100%';
      this.wrapper.style.height = '100%';

      let styles = window.getComputedStyle(this.wrapper);

      const mc:HTMLElement = this.root.querySelector('[main-content]');
      mc.style.height = styles.height;
      mc.style.minHeight = styles.height;
    });

    window.setTimeout(() => {
      this.root.setAttribute('duration', '');
      this.root.removeAttribute('fade-in');
    }, this.delay);

    MDCRipple.attachTo(this.wrapper);
  }

  @Listen('window:resize')
  resizeModal_() {
    const rect = this.root.getBoundingClientRect();
    const w = this.wrapper;

    w.style.top = rect.top + 'px';
    w.style.left = rect.left + 'px';
    w.style.width = rect.width + 'px';
    w.style.height = rect.height + 'px';

    const mc:HTMLElement = this.root.querySelector('[main-content]');
    mc.style.height = rect.height + 'px';
    mc.style.minHeight = rect.height + 'px';
  }

  @Listen('keydown.tab')
  handleTab(ev: KeyboardEvent) {
    var TAB_KEYCODE = 9;
    if (this.open && ev.keyCode === TAB_KEYCODE) {
      if (ev.shiftKey) {
        if (this.firstTabStop && ev.target === this.firstTabStop) {
          ev.preventDefault();
          this.lastTabStop.focus();
        }
      } else {
        if (this.lastTabStop && ev.target === this.lastTabStop) {
          ev.preventDefault();
          this.firstTabStop.focus();
        }
      }
    }
  }

  @Listen('keydown.enter')
  handleKeypress() {
    this.toggle_();
  }

  @Listen('keydown.space')
  handleSpace(ev: KeyboardEvent) {
    if (!this.open) {
      ev.preventDefault();
      this.open_();
    }
  }

  toggle_() {
    if (this.open) {
      this.close_();
    } else {
      this.open_();
    }
  }

  close_() {
    this.open = false;

    // Get the bounding rectangle of this element, in case the size has
    // changed for some reason between open and close.
    const rect = this.root.getBoundingClientRect();
    const w = this.wrapper;

    w.style.top = rect.top + 'px';
    w.style.left = rect.left + 'px';
    w.style.width = rect.width + 'px';
    w.style.height = rect.height + 'px';

    const content:HTMLElement = this.root.querySelector('[extra-content]');
    content.style.opacity = '0';

    // Begin the close transition for the scrim and wrapper.
    this.scrim.removeAttribute('open');
    w.removeAttribute('open');

    w.addEventListener('transitionend', (e: TransitionEvent) => this.onTransitionEnd_(e));

    //this.root.querySelector('[main-content]').removeAttribute('tabindex');
    content.removeAttribute('tabindex');
    this.root.setAttribute('aria-expanded', 'false');
    this.oldTabStop.focus();
  }

  open_() {
    this.open = true;

    // Get the current size of this element. The wrapper will be positioned
    // on top of it and expanded from there. The wrapper element does not have
    // CSS transition properties so this takes place instantly.
    // const w = this.getBoundingClientRect();
    const w = this.wrapper;

    this.resizeModal_();

    // Set the wrapper and scrim to visible while hiding the card.  This also
    // happens instantly.
    w.setAttribute('visible', '');
    this.root.setAttribute('open', '');
    this.scrim.removeAttribute('hidden');

    // Ensure the content of the wrapper is transparent, it will be faded in
    // as part of expanding the wrapper.
    const content:HTMLElement = this.root.querySelector('[extra-content]');
    content.style.opacity = '0';

    RenderStatus.afterNextRender(this, () => {
      w.setAttribute('transition', '');
      w.setAttribute('open', '');
      this.scrim.setAttribute('open', '');

      w.style.top = '10%';
      w.style.left = '20%';
      w.style.width = '60%';
      w.style.height = '80%';

      content.style.opacity = '1';
    });

    //this.root.querySelector('[main-content]').setAttribute('tabindex', '0');
    content.setAttribute('tabindex', '0');
    this.root.setAttribute('aria-expanded', '');
    this.setFocusTrap_();
  }

  onTransitionEnd_(e: TransitionEvent) {
    if (!this.open && e.propertyName === 'height') {
      // Only concerned about when the height transition is finished. There
      // are other transitions that finish earlier. The wrapper can be fully
      // hidden until the last transition is done.
      const w = this.wrapper;

      w.removeEventListener('transitionend', this.onTransitionEnd_);

      // Now that the closing transitions have finished:
      // - Hide the wrapper
      // - Remove the wrapper transition properties
      // - Hide the scrim
      // - Show the card
      w.removeAttribute('transition');
      w.removeAttribute('visible');
      this.root.removeAttribute('open');
      this.scrim.setAttribute('hidden', '');

      this.wrapper.style.top = '0';
      this.wrapper.style.left = '0';
      this.wrapper.style.width = '100%';
      this.wrapper.style.height = '100%';
    }
  }

  setFocusTrap_() {
    var focusableElementsSelector = [
      'a[href]:not([tabindex="-1"])',
      'area[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'iframe:not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contentEditable=true]:not([tabindex="-1"])'
    ].join(',');
    var focusableElements = this.root.querySelectorAll(focusableElementsSelector);

    if (focusableElements.length > 0) {
      this.firstTabStop = focusableElements[0] as HTMLElement;
      this.lastTabStop = focusableElements[focusableElements.length - 1] as HTMLElement;
    } else {
      // Reset saved tab stops when there are no focusable elements in the card.
      this.firstTabStop = null;
      this.lastTabStop = null;
    }

    this.oldTabStop = document.activeElement as HTMLElement;

    // Focus on app-drawer if it has non-zero tabindex. Otherwise, focus the first focusable
    // element in the drawer, if it exists. Use the tabindex attribute since the this.tabIndex
    // property in IE/Edge returns 0 (instead of -1) when the attribute is not set.
    var tabindex = this.root.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex, 10) > -1) {
      this.root.focus();
    } else if (this.firstTabStop) {
    }
    this.firstTabStop.focus();
  }
}
