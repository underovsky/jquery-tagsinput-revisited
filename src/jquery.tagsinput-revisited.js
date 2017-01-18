/* jQuery Tags Input Revisited Plugin
 *
 * Copyright (c) Krzysztof Rusnarczyk
 * Licensed under the MIT license */

/*
 * TODO: delimiter fixes
 */

(function($) {
	var delimiter = [];
	var callbacks = [];

	$.fn.addTag = function(value, options) {
		options = jQuery.extend({
			focus: false,
			callback: true
		}, options);
		
		this.each(function() {
			var id = $(this).attr('id');

			var tagslist = $(this).val().split(delimiter[id]);
			if (tagslist[0] === '') tagslist = [];

			value = jQuery.trim(value);
			
			if ((options.unique && $(this).tagExist(value)) || !_validateTag(value, options, tagslist)) {
				$('#' + id + '_tag').addClass('error');
				return false;
			}
			
			$('<span>').addClass('tag').append(
				$('<span>').text(value),
				$('<a>', {href: '#'}).click(function() {
					return $('#' + id).removeTag(encodeURI(value));
				})
			).insertBefore('#' + id + '_addTag');

			tagslist.push(value);

			$('#' + id + '_tag').val('');
			if (options.focus) {
				$('#' + id + '_tag').focus();
			} else {
				$('#' + id + '_tag').blur();
			}

			$.fn.tagsInput.updateTagsField(this, tagslist);

			if (options.callback && callbacks[id] && callbacks[id]['onAddTag']) {
				var f = callbacks[id]['onAddTag'];
				f.call(this, value);
			}
			
			if(callbacks[id] && callbacks[id]['onChange']) {
				var i = tagslist.length;
				var f = callbacks[id]['onChange'];
				f.call(this, $(this), tagslist[i - 1]);
			}
		});

		return false;
	};

	$.fn.removeTag = function(value) {
		value = decodeURI(value);
		
		this.each(function() {
			var id = $(this).attr('id');

			var old = $(this).val().split(delimiter[id]);

			$('#' + id + '_tagsinput .tag').remove();
			
			var str = '';
			for (i = 0; i < old.length; ++i) {
				if (old[i] != value) {
					str = str + delimiter[id] + old[i];
				}
			}

			$.fn.tagsInput.importTags(this, str);

			if (callbacks[id] && callbacks[id]['onRemoveTag']) {
				var f = callbacks[id]['onRemoveTag'];
				f.call(this, value);
			}
		});

		return false;
	};

	$.fn.tagExist = function(val) {
		var id = $(this).attr('id');
		var tagslist = $(this).val().split(delimiter[id]);
		return (jQuery.inArray(val, tagslist) >= 0);
	};

	$.fn.importTags = function(str) {
		var id = $(this).attr('id');
		$('#' + id + '_tagsinput .tag').remove();
		$.fn.tagsInput.importTags(this, str);
	};

	$.fn.tagsInput = function(options) {
		var settings = jQuery.extend({
			interactive: true,
			placeholder: 'Add a tag',
			minChars: 0,
			maxChars: null,
			limit: null,
			width: 'auto',
			height: 'auto',
			autocomplete: {selectFirst: false},
			hide: true,
			delimiter: ',',
			unique: true,
			removeWithBackspace: true
		}, options);

		var uniqueIdCounter = 0;

		this.each(function() {
			if (typeof $(this).data('tagsinput-init') !== 'undefined') return;

			$(this).data('tagsinput-init', true);

			if (settings.hide) $(this).hide();
			
			var id = $(this).attr('id');
			if (!id || delimiter[$(this).attr('id')]) {
				id = $(this).attr('id', 'tags' + new Date().getTime() + (uniqueIdCounter++)).attr('id');
			}

			var data = jQuery.extend({
				pid: id,
				real_input: '#' + id,
				holder: '#' + id + '_tagsinput',
				input_wrapper: '#' + id + '_addTag',
				fake_input: '#' + id + '_tag'
			}, settings);

			delimiter[id] = data.delimiter;

			if (settings.onAddTag || settings.onRemoveTag || settings.onChange) {
				callbacks[id] = [];
				callbacks[id]['onAddTag'] = settings.onAddTag;
				callbacks[id]['onRemoveTag'] = settings.onRemoveTag;
				callbacks[id]['onChange'] = settings.onChange;
			}

			var markup = '<div id="' + id + '_tagsinput" class="tagsinput"><div id="' + id + '_addTag">';

			if (settings.interactive) {
				markup = markup + '<input id="' + id + '_tag" value="" placeholder="' + settings.placeholder + '">';
			}

			$(markup).insertAfter(this);

			$(data.holder).css('width', settings.width);
			$(data.holder).css('min-height', settings.height);
			$(data.holder).css('height', settings.height);

			if ($(data.real_input).val() !== '') {
				$.fn.tagsInput.importTags($(data.real_input), $(data.real_input).val());
			}
			
			// Stop here if interactive options is not chosen
			if (!settings.interactive) return this;
			
			$(data.fake_input).val('');

			$(data.holder).on('click', data, function(event) {
				$(event.data.fake_input).focus();
				$(this).addClass('focus');
			});
			
			$(data.fake_input).on('blur', data, function(event) {
				$(data.holder).removeClass('focus');
			});

			if (settings.autocomplete_url !== undefined) {
				var autocomplete_options = {source: settings.autocomplete_url};
				
				for (attrname in settings.autocomplete) {
					autocomplete_options[attrname] = settings.autocomplete[attrname];
				}

				if (jQuery.Autocompleter !== undefined) {
					$(data.fake_input).autocomplete(settings.autocomplete_url, settings.autocomplete);
					$(data.fake_input).on('result', data, function(event, data, formatted) {
						if (data) {
							$('#' + id).addTag(data[0] + "", {
								focus: true,
								unique: settings.unique,
								minChars: settings.minChars,
								maxChars: settings.maxChars,
								limit: settings.limit
							});
						}
					});
				} else if (jQuery.ui.autocomplete !== undefined) {
					$(data.fake_input).autocomplete(autocomplete_options);
					$(data.fake_input).on('autocompleteselect', data, function(event, ui) {
						$(event.data.real_input).addTag(ui.item.value, {
							focus: true,
							unique: settings.unique,
							minChars: settings.minChars,
							maxChars: settings.maxChars,
							limit: settings.limit
						});
						
						return false;
					});
				}
			} else {
				$(data.fake_input).on('blur', data, function(event) {
					$(event.data.real_input).addTag($(event.data.fake_input).val(), {
						focus: true,
						unique: settings.unique,
						minChars: settings.minChars,
						maxChars: settings.maxChars,
						limit: settings.limit
					});
					
					return false;
				});
			}
			
			// If a user types a delimiter or enter create a new tag
			$(data.fake_input).on('keypress', data, function(event) {
				if (_checkDelimiter(event)) {
					event.preventDefault();
					
					$(event.data.real_input).addTag($(event.data.fake_input).val(), {
						focus: true,
						unique: settings.unique,
						minChars: settings.minChars,
						maxChars: settings.maxChars,
						limit: settings.limit
					});
					
					return false;
				}
			});
			
			// Deletes last tag on backspace
			data.removeWithBackspace && $(data.fake_input).on('keydown', function(event) {
				if (event.keyCode == 8 && $(this).val() === '') {
					 event.preventDefault();
					 var lastTag = $(this).closest('.tagsinput').find('.tag:last > span').text();
					 var id = $(this).attr('id').replace(/_tag$/, '');
					 $('#' + id).removeTag(encodeURI(lastTag));
					 $(this).trigger('focus');
				}
			});
			
			$(data.fake_input).blur();

			// Removes the error class when user changes the value of the fake input
			if (data.unique) {
				$(data.fake_input).keydown(function(event) {
					$(this).removeClass('error');
				});
			}
		});

		return this;
	};
	
	$.fn.tagsInput.updateTagsField = function(obj, tagslist) {
		var id = $(obj).attr('id');
		$(obj).val(tagslist.join(delimiter[id]));
	};

	$.fn.tagsInput.importTags = function(obj, val) {
		$(obj).val('');
		
		var id = $(obj).attr('id');
		var tags = val.split(delimiter[id]);
		
		for (i = 0; i < tags.length; ++i) {
			$(obj).addTag(tags[i], {
				focus: false,
				callback: false,
				minChars: 0,
				maxChars: null,
				limit: null
			});
		}
		
		if (callbacks[id] && callbacks[id]['onChange']) {
			var f = callbacks[id]['onChange'];
			f.call(obj, obj, tags[i]);
		}
	};
	
	var _validateTag = function(value, options, tagslist) {
		var result = true;
		
		if (value === '') result = false;
		if (value.length < options.minChars) result = false;
		if (options.maxChars !== null && value.length > options.maxChars) result = false;
		if (options.limit !== null && tagslist.length >= options.limit) result = false;
		
		return result;
	};
 
	var _checkDelimiter = function(event) {
		var found = false;
		
		if (event.which === 13) {
			return true;
		}

		if (typeof event.data.delimiter === 'string') {
			if (event.which == event.data.delimiter.charCodeAt(0)) {
				found = true;
			}
		} else {
			$.each(event.data.delimiter, function(index, delimiter) {
				if (event.which === delimiter.charCodeAt(0)) {
					found = true;
				}
			});
		}
		
		return found;
	 };
})(jQuery);
