import Ember from 'ember';
import layout from '../templates/components/power-select-with-create';
import { filterOptions, defaultMatcher } from 'ember-power-select/utils/group-utils';
const { computed, get } = Ember;

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
  optionsArray: computed('options.[]', function() {
    let options = this.get('options');
    if (!options) { return Ember.A(); }
    if (options.then) {
      return options.then(value => Ember.A(value).toArray());
    } else {
      return Ember.A(options).toArray();
    }
  }),

  powerSelectComponentName: computed('multiple', function() {
    return this.get('multiple') ? 'power-select-multiple' : 'power-select';
  }),

  shouldShowCreateOption(term) {
    return this.get('showCreateWhen') ? this.get('showCreateWhen')(term) : true;
  },

  // Actions
  actions: {
    onInput(input, select){
      // console.info(select);
      // console.info(e);
      //
      // return;
      //
      // if(!this.get('createAsTyping')){
      //   return;
      // }
      //
      // // We don't want to do anything if the user is pressing the arrow keys to navigate
      // // the dropdown menu
      // if(this._isArrowKey(e)){
      //   return;
      // }
      //
      // console.info(e);

        console.info(select);
        console.info("Input:[" + input + "]");
        if (Ember.isBlank(input)) {
          console.info("Clearing Results");
          console.info(select.results);
          select.options.clear();
          select.results.clear();
          // If we don't set highlighted to undefined it appears to have a residual value
          // which means if the user presses enter even when the input is empty a value
          // shows up
          Ember.set(select, 'highlighted', undefined);
        }
      return true;


      //
      // // The value of searchText always seems to be one key behind unless I wait for next
      // Ember.run.next(this, function(){
      //   let selected = this.get('selected');
      //
      //   //console.info("SearchText: " + select.searchText);
      //
      //
      //   if (!selected.includes(select.searchText) && !Ember.isBlank(select.searchText)) {
      //     let results = select.results;
      //     let suggestion = this.buildSuggestionForTerm(select.searchText);
      //
      //     if(results.length !== 0){
      //       //remove the existing suggestion
      //       results.shiftObject();
      //     }
      //     //add our "suggestion" which is based off what the user has typed and highlight it
      //     //console.info("Adding Suggestion:");
      //     //console.info(suggestion);
      //     results.unshiftObject(suggestion);
      //     select.actions.highlight(suggestion);
      //   }
      //
      //   if(Ember.isBlank(select.searchText)){
      //     select.results.clear();
      //     // If we don't set highlighted to undefined it appears to have a residual value
      //     // which means if the user presses enter even when the input is empty a value
      //     // shows up
      //     Ember.set(select, 'highlighted', undefined);
      //   }
      // });
    },
    searchAndSuggest(term, select) {
      console.info(term);
      let newOptions = this.get('optionsArray');

      if (term.length === 0) {
        return newOptions;
      }


      //---------------------------
      let selected = this.get('selected');
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

      if(Ember.isBlank(term)){
        select.results.clear();
        // If we don't set highlighted to undefined it appears to have a residual value
        // which means if the user presses enter even when the input is empty a value
        // shows up
        Ember.set(select, 'highlighted', undefined);
      }
      //---------------------------


      if (this.get('search')) {
        return Ember.RSVP.resolve(this.get('search')(term)).then((results) =>  {
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

    selectOrCreate(selection) {
      console.info("Select or create");
      let suggestion;
      if (this.get('multiple')) {
        suggestion = selection.filter((option) => {
          return option.__isSuggestion__;
        })[0];
      } else if (selection && selection.__isSuggestion__) {
        suggestion = selection;
      }

      if (suggestion) {
        this.get('oncreate')(suggestion.__value__);
      } else {
        this.get('onchange')(selection);
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

  _isArrowKey(e){
    if(e.keyCode === 37 || // Left Arrow
        e.keyCode === 38 || // Up Arrow
        e.keyCode === 39 || // Right Arrow
        e.keyCode === 40) { // Down Arrow
      return true;
    }
    return false;
  }


});
