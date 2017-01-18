/* jQuery Tags Input Revisited Plugin
 *
 * Copyright (c) Krzysztof Rusnarczyk
 * Licensed under the MIT license */

/*
 * TODO: formatting
 * TODO: delimiter fixes
 * TODO: verify and simplify parts of code
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
			if (tagslist[0] === '') {
				tagslist = new Array();
			}

			value = jQuery.trim(value);

			if (options.unique) {
				var skipTag = $(this).tagExist(value);
				if (skipTag) {
					$('#'+id+'_tag').addClass('error');
				}
			} else {
				var skipTag = false;
			}

			// TODO: move into validation function
			if (value !='' && skipTag != true) {
				$('<span>').addClass('tag').append(
					$('<span>').text(value),
					$('<a>', {href: '#'}).click(function() {
						return $('#' + id).removeTag(escape(value));
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
			}
		});

		return false;
	};

	$.fn.removeTag = function(value) {
		value = unescape(value);
		
		this.each(function() {
			var id = $(this).attr('id');

			var old = $(this).val().split(delimiter[id]);

			$('#'+id+'_tagsinput .tag').remove();
			
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
	}

	$.fn.tagsInput = function(options) {
		var settings = jQuery.extend({
			interactive: true,
			placeholder: 'Add a tag',
			minChars: 0,
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
				callbacks[id] = new Array();
				callbacks[id]['onAddTag'] = settings.onAddTag;
				callbacks[id]['onRemoveTag'] = settings.onRemoveTag;
				callbacks[id]['onChange'] = settings.onChange;
			}

			var markup = '<div id="'+id+'_tagsinput" class="tagsinput"><div id="'+id+'_addTag">';

			if (settings.interactive) {
				markup = markup + '<input id="'+id+'_tag" value="" placeholder="' + settings.placeholder + '" />';
			}

			$(markup).insertAfter(this);

			$(data.holder).css('width',settings.width);
			$(data.holder).css('min-height',settings.height);
			$(data.holder).css('height',settings.height);

			if ($(data.real_input).val()!='') {
				$.fn.tagsInput.importTags($(data.real_input),$(data.real_input).val());
			}
			
			if (!settings.interactive) return;
			
			$(data.fake_input).val('');

			$(data.holder).on('click', data, function(event) {
				$(event.data.fake_input).focus();
				$(this).addClass('focus');
			});

			$(data.fake_input).on('focus',data,function(event) {
				if ($(event.data.fake_input).val()==$(event.data.fake_input).attr('data-default')) {
					$(event.data.fake_input).val('');
				}
			});
			
			$(data.fake_input).on('blur', data, function(event) {
				$(data.holder).removeClass('focus');
			});

			if (settings.autocomplete_url != undefined) {
				autocomplete_options = {source: settings.autocomplete_url};
				for (attrname in settings.autocomplete) {
					autocomplete_options[attrname] = settings.autocomplete[attrname];
				}

				if (jQuery.Autocompleter !== undefined) {
					$(data.fake_input).autocomplete(settings.autocomplete_url, settings.autocomplete);
					$(data.fake_input).bind('result',data,function(event,data,formatted) {
						if (data) {
							$('#'+id).addTag(data[0] + "",{focus:true,unique:(settings.unique)});
						}
						});
				} else if (jQuery.ui.autocomplete !== undefined) {
					$(data.fake_input).autocomplete(autocomplete_options);
					$(data.fake_input).bind('autocompleteselect',data,function(event,ui) {
						$(event.data.real_input).addTag(ui.item.value,{focus:true,unique:(settings.unique)});
						return false;
					});
				}


			} else {
					// if a user tabs out of the field, create a new tag
					// this is only available if autocomplete is not used.
					$(data.fake_input).bind('blur',data,function(event) {
						var d = $(this).attr('data-default');
						if ($(event.data.fake_input).val()!='' && $(event.data.fake_input).val()!=d) {
							if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) )
								$(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true,unique:(settings.unique)});
						} else {
							$(event.data.fake_input).val($(event.data.fake_input).attr('data-default'));
						}
						return false;
					});

			}
			// if user types a default delimiter like comma,semicolon and then create a new tag
			$(data.fake_input).bind('keypress',data,function(event) {
				if (_checkDelimiter(event)) {
						event.preventDefault();
					if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) )
						$(event.data.real_input).addTag($(event.data.fake_input).val(),{focus:true,unique:(settings.unique)});
					return false;
				}
			});
			
			// Delete last tag on backspace
			data.removeWithBackspace && $(data.fake_input).bind('keydown', function(event)
			{
				if(event.keyCode == 8 && $(this).val() == '')
				{
					 event.preventDefault();
					 var last_tag = $(this).closest('.tagsinput').find('.tag:last > span').text();
					 var id = $(this).attr('id').replace(/_tag$/, '');
					 $('#' + id).removeTag(escape(last_tag));
					 $(this).trigger('focus');
				}
			});
			
			$(data.fake_input).blur();

			// Removes the error class when user changes the value of the fake input
			if (data.unique) {
				$(data.fake_input).keydown(function(event){
					if(event.keyCode == 8 || String.fromCharCode(event.which).match(/\w+|[áéíóúÁÉÍÓÚñÑ,/]+/)) {
						$(this).removeClass('error');
					}
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
				callback: false
			});
		}
		
		if (callbacks[id] && callbacks[id]['onChange']) {
			var f = callbacks[id]['onChange'];
			f.call(obj, obj, tags[i]);
		}
	};

	var _checkDelimiter = function(event) {
		var found = false;
		
		if (event.which == 13) {
			 return true;
		}

		if (typeof event.data.delimiter === 'string') {
			if (event.which == event.data.delimiter.charCodeAt(0)) {
				found = true;
			}
		} else {
			$.each(event.data.delimiter, function(index, delimiter) {
				if (event.which == delimiter.charCodeAt(0)) {
					found = true;
				}
			});
		}
		
		return found;
	 };
})(jQuery);
