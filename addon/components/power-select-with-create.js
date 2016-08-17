import Ember from 'ember';
import layout from '../templates/components/power-select-with-create';
import {filterOptions, defaultMatcher} from 'ember-power-select/utils/group-utils';
const {computed, get} = Ember;

export default Ember.Component.extend({
  tagName: '',
  layout: layout,
  matcher: defaultMatcher,
  myResults: [],
  // Lifecycle hooks
  init() {
    this._super(...arguments);
    Ember.assert('{{power-select-with-create}} requires an `oncreate` function', this.get('oncreate') && typeof this.get('oncreate') === 'function');
  },

  // CPs
  optionsArray: computed('options.[]', function () {
    let options = this.get('options');
    if (!options) {
      return Ember.A();
    }
    if (options.then) {
      return options.then(value => Ember.A(value).toArray());
    } else {
      return Ember.A(options).toArray();
    }
  }),

  powerSelectComponentName: computed('multiple', function () {
    return this.get('multiple') ? 'power-select-multiple' : 'power-select';
  }),

  shouldShowCreateOption(term) {
    return this.get('showCreateWhen') ? this.get('showCreateWhen')(term) : true;
  },

  // Actions
  actions: {
    /**
     * Checks to see if the pressed key is a tab and then auto creates the selected option based
     * on what the user has already typed into the input.
     * @param select
     * @param e
     */
    onKeyDown(select, e){
      if (e && e.keyCode === 9 /*tab*/ && typeof(select.highlighted) === 'object') {
        // needs to be an array because this is multi select
        select.actions.select([select.highlighted]);
        select.actions.close();
      }
    },
    /**
     * Input provides the text input by the user including if the user deletes all input
     *
     * @param input
     * @param select
       */
    onInput(input, select){
      // console.info("onInput:[" + input + "]");
      // console.info(select);
      if (Ember.isBlank(input)) {
        // console.info("Clearing Results");
        this._clearSelect(select);
      }
    },
    searchAndSuggest(term, select) {
      //console.info("[searchAndSuggest] Term: " + term);
      let newOptions = this.get('optionsArray');

      if (term.length === 0) {
        return newOptions;
      }

      //---------------------------
      // Create typed text behavior
      //---------------------------
      let selected = select.selected;//this.get('selected');
      if (!selected.includes(term) && !Ember.isBlank(term)) {
        let results = select.results;
        let suggestion = this.buildSuggestionForTerm(term);

        if (results.length !== 0) {
          //remove the existing suggestion
          results.shiftObject();
        }
        results.unshiftObject(suggestion);
        select.actions.highlight(suggestion);
      }
      //---------------------------
      //---------------------------
      //---------------------------

      if (this.get('search')) {
        return Ember.RSVP.resolve(this.get('search')(term)).then((results) => {
          if (results.toArray) {
            results = results.toArray();
          }
          // console.info("SearchText At Suggest Resolve: " + select.searchText);
          // console.info("Term at Suggest Resolve:" + term);
          if (!Ember.isBlank(select.searchText) && this.shouldShowCreateOption(term)) {
            // console.info("Adding term suggestion: " + term);
            results.unshift(this.buildSuggestionForTerm(term));
          }

          return results;
        });
      }

      newOptions = this.filter(Ember.A(newOptions), term);
      if (this.shouldShowCreateOption(term)) {
        newOptions.unshift(this.buildSuggestionForTerm(term));
      }

      return newOptions;
    },

    selectOrCreate(selection, select) {
      // console.info("Select or create");
      // console.info(selection);
      let suggestion;
      if (this.get('multiple')) {
        // This clearSelect is required because if the user clicks on the X button to remove a selected item
        // the `oninput` callback is not called which is where we normally check to see if all suggestions
        // should be removed
        if (Array.isArray(selection) && selection.length === 0) {
          this._clearSelect(select);
        }
        suggestion = selection.filter((option) => {
          return option.__isSuggestion__;
        })[0];
      } else if (selection && selection.__isSuggestion__) {
        suggestion = selection;
      }

      if (suggestion) {
        Ember.run.scheduleOnce('afterRender', this, this.get('oncreate'), suggestion.__value__);
      } else {
        Ember.run.scheduleOnce('afterRender', this, this.get('onchange'), selection);
      }
    }
  },

  // Methods
  filter(options, searchText) {
    let matcher;
    if (this.get('searchField')) {
      matcher = (option, text) => this.matcher(get(option, this.get('searchField')), text);
    } else {
      matcher = (option, text) => this.matcher(option, text);
    }
    return filterOptions(options || [], searchText, matcher);
  },

  buildSuggestionForTerm(term) {
    return {
      __isSuggestion__: true,
      __value__: term,
      text: this.buildSuggestionLabel(term),
    };
  },

  buildSuggestionLabel(term) {
    let buildSuggestion = this.get('buildSuggestion');
    if (buildSuggestion) {
      return buildSuggestion(term);
    }
    return `Add "${term}"...`;
  },

  /**
   * Clears all the options and results to give a clean slate for the
   * input
   *
   * @param select
   * @private
   */
  _clearSelect(select){
    select.options.clear();
    select.results.clear();
    // If we don't set highlighted to undefined it appears to have a residual value
    // which means if the user presses enter even when the input is empty a value
    // shows up
    Ember.set(select, 'highlighted', undefined);
  },

  _isArrowKey(e){
    if (e.keyCode === 37 || // Left Arrow
      e.keyCode === 38 || // Up Arrow
      e.keyCode === 39 || // Right Arrow
      e.keyCode === 40) { // Down Arrow
      return true;
    }
    return false;
  }


});
