import Ember from 'ember';
import ResizeHandlerMixin from 'ember-singularity-mixins/mixins/resize-handler';
import clamp from 'ember-truncate/utils/clamp';
import layout from 'ember-truncate/templates/components/truncate-multiline';

const cssNamespace = 'truncate-multiline';

/**
 * A generic component used to truncate text to a specified number of lines.
 *
 * It can be used in an inline form
 *
 * ```
 * {{truncate-multiline text="foo bar"}}
 * ```
 *
 * or a block form.
 *
 * ```
 * {{#truncate-multiline}}
 *   foo bar
 * {{/truncate-multiline}}
 * ```
 *
 * @class SharedShowMoreTextMultilineComponent
 */

export default Ember.Component.extend(ResizeHandlerMixin, {
  layout: layout,

  /**
   * The text to truncate. This is overridden if the block form is used.
   * @type {String}
   */
  text: '',

  /**
   * The number of lines at which to begin truncation.
   * @type {Number}
   * @default 3
   */
  lines: 3,

  /**
   * Whether or not to truncate the text. Can be used to control truncation
   * from outside of the component.
   * @type {Boolean}
   */
  truncate: true,

  /**
   * Internal state of whether or not to truncate the text.
   * @type {Boolean}
   * @private
   */
  _truncate: true,

  /**
   * Whether the text needed truncating or was short enough already.
   * @property isTruncated
   * @type {Boolean}
   */
  isTruncated: Ember.computed.readOnly('_isTruncated'),

  /**
   * Internal state of whether or not the text needed truncating.
   * @type {Boolean}
   * @private
   */
  _isTruncated: false,

  /**
   * An override that can be used to hide both buttons.
   * @type {Boolean}
   */
  showButton: true,

  /**
   * An override that can be used to hide the "see more" button.
   * @type {Boolean}
   */
  showSeeMoreButton: true,

  /**
   * An override that can be used to hide the "see less" button.
   * @type {Boolean}
   */
  showSeeLessButton: true,

  /**
   * The text to display in the "see more" button.
   * @type {String}
   */
  seeMoreButtonText: 'see more',

  /**
   * The text to display in the "see less" button.
   * @type {String}
   */
  seeLessButtonText: 'see less',

  /**
   * Whether or not the "see more" button should be visible.
   * @property _shouldShowSeeMoreButton
   * @type {Boolean}
   * @private
   */
  _shouldShowSeeMoreButton: Ember.computed.and('showButton', 'showSeeMoreButton', 'isTruncated'),

  /**
   * Whether or not the "see less" button should be visible.
   * @property _shouldShowSeeLessButton
   * @type {Boolean}
   * @private
   */
  _shouldShowSeeLessButton: Ember.computed.and('showButton', 'showSeeLessButton', 'isTruncated'),

  /**
   * Keeps track of whether or not _doTruncate has been run.
   * @type {Boolean}
   * @private
   */
  _didTruncate: false,

  /**
   * Resets the component when the `text` attribute of the component has changed
   * @return {Void}
   */
  didUpdateAttrs(attrs) {
    this._super(attrs);

    if (didAttrChange(attrs, 'truncate')) {
      this.set('_truncate', this.get('truncate'));
    }

    if (didAttrChange(attrs, 'text') || didAttrChange(attrs, 'truncate') || didAttrChange(attrs, 'lines')) {
      this._resetState();
    }
  },

  /**
   * Kicks off the truncation after render.
   * @return {Void}
   */
  didRender() {
    this._super(...arguments);
    if (!this.get('_didTruncate')) {
      this._doTruncation();
    }
  },

  /**
   * Resets the state of the component
   * @return {Void}
   * @private
   */
  _resetState() {
    let truncate = this.get('_truncate');
    if (truncate) {
      // trigger a rerender/retruncate
      this.set('_didTruncate', false);
      this.set('_truncate', false);
      Ember.run.scheduleOnce('afterRender', this, () => {
        this.set('_truncate', truncate);
      });
    }
  },

  /**
   * Does the truncation by calling the clamp utility.
   * @return {Void}
   * @private
   */
  _doTruncation() {
    if (this.get('_truncate')) {
      Ember.run.scheduleOnce('afterRender', this, () => {
        let el = this.element.querySelector(`.${cssNamespace}--truncation-target`);
        let button = this.element.querySelector(`[class^=${cssNamespace}--button]`);
        button.parentNode.removeChild(button);
        clamp(el, this.get('lines'), (didTruncate) => this.set('_isTruncated', didTruncate), `${cssNamespace}--last-line`);
        let ellipsizedSpan = el.lastChild;
        el.removeChild(ellipsizedSpan);
        let wrappingSpan = document.createElement('span');
        wrappingSpan.classList.add(`${cssNamespace}--last-line-wrapper`);
        wrappingSpan.appendChild(ellipsizedSpan);
        wrappingSpan.appendChild(button);
        el.appendChild(wrappingSpan);
        this.set('_didTruncate', true);
      });
    }
  },

  /**
   * Kicks off truncation on resize by triggering a rerender.
   * @return {Void}
   */
  resize() {
    this._resetState();
  },

  /**
   * Returns false so truncation does not happen twice on insert.
   * @property resizeOnInsert
   * @type {Boolean}
   */
  resizeOnInsert: false,

  actions: {
    /**
     * Called by the "see more/see less" button. Toggles truncation.
     * @return {Void}
     */
    toggleTruncate() {
      let wasTruncated = this.get('_truncate');
      this.toggleProperty('_truncate');

      if (wasTruncated) {
        let onExpand = this.attrs.onExpand;

        if (onExpand) {
          if (typeof onExpand === 'function') {
            onExpand();
          } else {
            this.sendAction('onExpand');
          }
        }
      } else {
        // Need to reset state when the text is retruncated via the 'See Less' button
        this._resetState();

        let onCollapse = this.attrs.onCollapse;

        if (onCollapse) {
          if (typeof onCollapse === 'function') {
            onCollapse();
          } else {
            this.sendAction('onCollapse');
          }
        }
      }

      let onToggleTruncate = this.attrs.onToggleTruncate;

      if (onToggleTruncate) {
        if (typeof onToggleTruncate === 'function') {
          onToggleTruncate(!wasTruncated);
        } else {
          this.sendAction('onToggleTruncate', !wasTruncated);
        }
      }
    }
  }
});

/**
 * Helper function to determine if an attribute has changed.
 * @private
 * @param attrs {Object}
 * @param name {String}
 * @return {Boolean}
 */
function didAttrChange(attrs, name) {
  let oldAttr = attrs.oldAttrs[name];
  let newAttr = attrs.newAttrs[name];

  // If both attrs are undefined, nothing has changed
  if (oldAttr == null && newAttr == null) {
    return false;
  }

  // If only one attr is undefined, it must have changed
  if (oldAttr == null || newAttr == null) {
    return true;
  }

  /**
  * In integration tests, the attributes passed to 'didUpdateAttrs' are objects,
  * while in the app they are the values of the attributes themselves.
  *
  * However, if the value of the passed attribute hasn't changed it is NOT an object,
  * it is the value itself.
  */
  oldAttr = oldAttr.value || oldAttr;
  newAttr = newAttr.value || newAttr;

  // toString is called in case a user has passed in a SafeString
  oldAttr = oldAttr.toString && oldAttr.toString() || oldAttr;
  newAttr = newAttr.toString && newAttr.toString() || newAttr;

  return oldAttr !== newAttr;
}
