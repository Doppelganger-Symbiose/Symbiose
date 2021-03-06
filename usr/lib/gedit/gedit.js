/**
 * Editeur de texte gedit.
 * @version 1.2
 * @author $imon
 */

new W.ScriptFile('usr/lib/codemirror/codemirror.js');
new W.Stylesheet('/usr/share/css/codemirror/main.css');

var geditProperties = $.webos.extend($.webos.properties.get('container'), {
	_name: 'gedit',
	options: {
		file: false,
		language: 'text'
	},
	_create: function() {
		var that = this;
		
		this.options._components.codemirror = CodeMirror(this.element[0], {
			value: '',
			mode: 'text',
			lineNumbers: true,
			onChange: function(editor, change) {
				that._trigger('change', { type: 'change' }, { editor: that.element, change: change });
			}
		});
		
		this.element.addClass('cursor-text');
		
		this._setLanguage(this.options.language);
		
		if (typeof this.options.file != 'undefined' && this.options.file != false) {
			this.openFile(this.options.file);
		} else {
			this.createEmptyFile();
		}
	},
	createEmptyFile: function() {
		this._trigger('createemptyfile');
		this.option('file', false);		
		this.options._components.codemirror.setValue('');
		this.option('language', 'text');
		this.options._components.codemirror.clearHistory();
	},
	openFile: function(file) {
		var that = this;
		
		if (file.getAttribute('is_dir')) {
			W.Error.trigger('Le fichier sp&eacute;cifi&eacute; est un dossier');
			return;
		}
		
		file.getContents(new W.Callback(function(contents) {
			that.options.file = file;
			that.options._components.codemirror.setValue(contents);
			that.options._components.codemirror.clearHistory();
			that._setLanguage($.webos.gedit.modeFromExt(file.getAttribute('extension')));
			that._trigger('openfile');
		}, function(response) {
			W.Error.trigger('Impossible d\'ouvrir "'+file.getAttribute('path')+'"', response.getAllChannels());
		}));
	},
	_setLanguage: function(language) {
		if (jQuery.inArray(language, $.webos.gedit.modes()) == -1) {
			return;
		}
		
		$.webos.gedit.loadMode(language);
		
		this.options.language = language;
		
		this.options._components.codemirror.setOption('mode', language);
	},
	undo: function() {
		this.options._components.codemirror.undo();
	},
	redo: function() {
		this.options._components.codemirror.redo();
	},
	contents: function(value) {
		if (typeof value == 'undefined') {
			return this.options._components.codemirror.getValue();
		} else {
			this.options._components.codemirror.setValue(value);
		}
	},
	codemirror: function(method) {
		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		
		if (this.options._components.codemirror[method]) {
			return this.options._components.codemirror[method].apply(this.options._components.codemirror, args);
		}
	},
	_update: function(key, value) {
		switch (key) {
			case 'language':
				this._setLanguage(value);
				break;
		}
	}
});
$.widget('webos.gedit', geditProperties);

$.webos.gedit = function(options) {
	return $('<div></div>').gedit(options);
};

$.webos.gedit.modes = function() {
	return ['clike',
            'clojure',
            'coffeescript',
            'css',
            'diff',
            'gfm',
            'groovy',
            'haskell',
            'htmlembedded',
            'htmlmixed',
            'javascript',
            'jinja2',
            'lua',
            'markdown',
            'ntriples',
            'pascal',
            'perl',
            'php',
            'plsql',
            'python',
            'r',
            'rst',
            'ruby',
            'rust',
            'scheme',
            'smalltalk',
            'sparql',
            'stex',
            'text',
            'tiddlywiki',
            'velocity',
            'xml',
            'xmlpure',
            'yaml'];
};
$.webos.gedit.depends = function(mode) {
	var depends = {
		htmlmixed: ['xml', 'javascript', 'css'],
		php: ['xml', 'javascript', 'css', 'clike']
	};
	
	if (typeof depends[mode] == 'undefined') {
		return [];
	}
	
	return depends[mode];
};

$.webos.gedit.modesLoaded = ['text'];

$.webos.gedit.modeFromExt = function(ext) {
	var languages = {
		'c': 'clike',
		'c++': 'clike',
		'java': 'clike',
		'clj': 'clojure',
		'coffee': 'coffeescript',
		'aspx': 'htmlembedded',
		'ejs': 'htmlembedded',
		'jsp': 'htmlembedded',
		'html': 'htmlmixed',
		'js': 'javascript',
		'pl': 'perl',
		'pm': 'perl',
		'py': 'python',
		'rb': 'ruby',
		'txt': 'text'
	};
	
	if (jQuery.inArray(ext, $.webos.gedit.modes()) != -1) {
		return ext;
	} else if (jQuery.inArray(languages[ext], $.webos.gedit.modes()) != -1) {
		return languages[ext];
	} else {
		return 'text';
	}
};
$.webos.gedit.loadMode = function(mode) {
	if (jQuery.inArray(mode, $.webos.gedit.modesLoaded) != -1) {
		return;
	}
	
	var depends = $.webos.gedit.depends(mode);
	if (depends.length > 0) {
		for (var i = 0; i < depends.length; i++) {
			$.webos.gedit.loadMode(depends[i]);
		}
	}
	
	new W.ScriptFile('usr/lib/codemirror/mode/'+mode+'/'+mode+'.js');
	$.webos.gedit.modesLoaded.push(mode);
};

function GEditWindow(file) {
	var that = this;
	
	this._window = $.w.window({
		title: '&Eacute;diteur de texte gedit',
		icon: new W.Icon('apps/text-editor'),
		width: 500,
		height: 300,
		stylesheet: 'usr/share/css/gedit/main.css'
	});
	
	this._refreshTitle = function() {
		var file = this._gedit.gedit('option', 'file');
		
		var title;
		if (typeof file != 'undefined' && file != false) {
			title = file.getAttribute('path');
		} else {
			title = 'Nouveau fichier';
		}
		
		title += ' - gedit';
		
		this._window.window('option', 'title', title);
	};
	
	this.openAboutWindow = function() {
		var aboutWindow = $.w.window.about({
			name: 'gedit',
			version: '0.2',
			description: 'gedit est un petit &eacute;diteur de texte l&eacute;ger.',
			author: '$imon',
			icon: new W.Icon('applications/gedit')
		});
		aboutWindow.window('open');
	};
	
	this.save = function(callback) {
		var callback = W.Callback.toCallback(callback);
		
		var file = this._gedit.gedit('option', 'file');
		var contents = this._gedit.gedit('contents');
		var saveFn = function(file) {
			that._window.window('loading', true);
			file.setContents(contents, new W.Callback(function() {
				that._contents = contents;
				that._refreshTitle();
				that._window.window('loading', false);
				that._isSaved = true;
				callback.success(file);
			}, function(response) {
				that._window.window('loading', false);
				response.triggerError('Impossible d\'enregistrer le fichier "'+file.getAttribute('path')+'"');
			}));
		};
		
		if (typeof file != 'undefined' && file != false) {
			saveFn(file);
		} else {
			new NautilusFileSelectorWindow({
				parentWindow: that._window,
				exists: false
			}, function(path) {
				if (typeof path != 'undefined') {
					W.File.load(path, new W.Callback(function(file) {
						saveFn(file);
					}, function(response) {
						W.File.createFile(path, new W.Callback(function(file) {
							saveFn(file);
						}, function(response) {
							response.triggerError('Impossible d\'enregistrer le fichier "'+path+'"');
						}));
					}));
				}
			});
		}
	};
	
	this.saveAs = function(callback) {
		var callback = W.Callback.toCallback(callback);
		
		var contents = this._gedit.gedit('contents');
		var saveFn = function(file) {
			that._window.window('loading', true);
			file.setContents(contents, new W.Callback(function() {
				that._contents = contents;
				that._refreshTitle();
				that._window.window('loading', false);
				that._isSaved = true;
				callback.success(file);
			}, function(response) {
				that._window.window('loading', false);
				response.triggerError('Impossible d\'enregistrer le fichier "'+file.getAttribute('path')+'"');
			}));
		};
		
		new NautilusFileSelectorWindow({
			parentWindow: that._window,
			exists: false
		}, function(path) {
			if (typeof path != 'undefined') {
				W.File.load(path, new W.Callback(function(file) {
					saveFn(file);
				}, function(response) {
					W.File.createFile(path, new W.Callback(function(file) {
						saveFn(file);
					}, function(response) {
						response.triggerError('Impossible d\'enregistrer le fichier "'+path+'"');
					}));
				}));
			}
		});
	};
	
	this.mode = function(mode) {
		if (!mode) {
			return this._gedit.gedit('option', 'language');
		} else {
			this._gedit.gedit('option', 'language', mode);
		}
	};
	
	this._isSaved = false;
	
	this.saved = function() {
		return this._isSaved;
	};
	
	var headers = this._window.window('header');
	
	var menu = $.w.menuWindowHeader().appendTo(headers);
	
	var fileItem = $.w.menuItem('Fichier').appendTo(menu);
	fileItemContent = fileItem.menuItem('content');
	
	$.w.menuItem('Nouveau')
		.click(function() {
			new GEditWindow();
		})
		.appendTo(fileItemContent);
	
	$.w.menuItem('Ouvrir...')
		.click(function() {
			new NautilusFileSelectorWindow({
				parentWindow: that._window
			}, function(file) {
				if (typeof file != 'undefined') {
					that._gedit.gedit('openFile', file);
				}
			});
		})
		.appendTo(fileItemContent);
	
	$.w.menuItem('Enregistrer')
		.click(function() {
			that.save();
		})
		.appendTo(fileItemContent);
	
	$.w.menuItem('Enregistrer sous...')
		.click(function() {
			that.saveAs();
		})
		.appendTo(fileItemContent);
	
	$.w.menuItem('Quitter')
		.click(function() {
			that._window.window('close');
		})
		.appendTo(fileItemContent);
	
	var editItem = $.w.menuItem('&Eacute;dition').appendTo(menu);
	editItemContent = editItem.menuItem('content');
	
	$.w.menuItem('Annuler')
		.click(function() {
			that._gedit.gedit('undo');
		})
		.appendTo(editItemContent);
	
	$.w.menuItem('R&eacute;tablir')
		.click(function() {
			that._gedit.gedit('redo');
		})
		.appendTo(editItemContent);
	
	var viewItem = $.w.menuItem('Affichage').appendTo(menu);
	viewItemContent = viewItem.menuItem('content');
	
	var modeItem = $.w.menuItem('Mode de coloration').appendTo(viewItemContent);
	var modes = $.webos.gedit.modes();
	var letters = {};
	for (var i = 0; i < modes.length; i++) {
		(function(mode) {
			var firstLetter = mode.substr(0, 1);
			if (!letters[firstLetter]) {
				letters[firstLetter] = $.w.menuItem(firstLetter).appendTo(modeItem.menuItem('content'));
			}
			
			$.w.menuItem(mode).click(function() {
				that.mode(mode);
			}).appendTo(letters[firstLetter].menuItem('content'));
		})(modes[i]);
	}
	
	var helpItem = $.w.menuItem('Aide').appendTo(menu);
	helpItemContent = helpItem.menuItem('content');
	
	$.w.menuItem('&Agrave; propos')
		.click(function() {
			that.openAboutWindow();
		})
		.appendTo(helpItemContent);
	
	var toolbar = $.w.toolbarWindowHeader().appendTo(headers);
	
	this._buttons = {};
	
	this._buttons.createEmptyFile = $.w.toolbarWindowHeaderItem('', new W.Icon('actions/document-new', 'button'))
		.click(function() {
			new GEditWindow();
		})
		.appendTo(toolbar);
	this._buttons.openFile = $.w.toolbarWindowHeaderItem('Ouvrir', new W.Icon('actions/document-open', 'button'))
		.click(function() {
			new NautilusFileSelectorWindow({
				parentWindow: that._window
			}, function(file) {
				if (typeof file != 'undefined') {
					that._gedit.gedit('openFile', file);
				}
			});
		})
		.appendTo(toolbar);
	this._buttons.saveFile = $.w.toolbarWindowHeaderItem('Enregistrer', new W.Icon('actions/document-save', 'button'))
		.click(function() {
			that.save();
		})
		.appendTo(toolbar);
	this._buttons.undo = $.w.toolbarWindowHeaderItem('Annuler', new W.Icon('actions/edit-undo', 'button'))
		.click(function() {
			that._gedit.gedit('undo');
		})
		.appendTo(toolbar);
	this._buttons.redo = $.w.toolbarWindowHeaderItem('', new W.Icon('actions/edit-redo', 'button'))
		.click(function() {
			that._gedit.gedit('redo');
		})
		.appendTo(toolbar);
	
	this._content = $('<div></div>').appendTo(this._window.window('content'));
	
	this._gedit = $.w.gedit({
		file: file
	}).bind('geditopenfile', function() {
		that._refreshTitle();
		that._isSaved = true;
	}).bind('geditcreateemptyfile', function() {
		that._refreshTitle();
		that._isSaved = false;
		that._content.scrollPane('reload');
	}).bind('geditchange', function() {
		if (that._isSaved) {
			that._isSaved = false;
		}
	}).bind('geditopenfile', function() {
		that._content.scrollPane('reload');
	}).bind('mousedown', function() {
		var speed = 0.75;
		var offset = that._content.offset(), dimentions = {
			width: that._content.width(),
			height: that._content.height()
		};
		var distanceX = 0, distanceY = 0;
		
		var timer = setInterval(function() {
			if (distanceX != 0) {
				that._content.scrollPane('scrollByX', distanceX * speed, false);
			}
			if (distanceY != 0) {
				that._content.scrollPane('scrollByY', distanceY * speed, false);
			}
		}, 100);
		$(document).bind('mousemove.gedit.webos', function(e) {
			if (e.pageX < offset.left) {
				distanceX = e.pageX - offset.left;
			} else if (e.pageX > offset.left + dimentions.width) {
				distanceX = e.pageX - (offset.left + dimentions.width);
			} else {
				distanceX = 0;
			}
			
			console.log(e.pageY, offset.top, offset.top + dimentions.height);
			if (e.pageY < offset.top) {
				distanceY = e.pageY - offset.top;
			} else if (e.pageY > offset.top + dimentions.height) {
				distanceY = e.pageY - (offset.top + dimentions.height);
			} else {
				distanceY = 0;
			}
		});
		$(document).one('mouseup', function() {
			$(document).unbind('mousemove.gedit.webos');
			clearInterval(timer);
		});
	});
	
	this._gedit.gedit('codemirror', 'setOption', 'onCursorActivity', function() {
		if (that._gedit.gedit('codemirror', 'getSelection').length > 0) { //Si on selectionne du texte, c'est un autre code qui gere le deplacement
			return;
		}
		
		var coords = that._gedit.gedit('codemirror', 'cursorCoords', false, 'page');
		var offset = that._content.offset(), dimentions = {
			width: that._content.width(),
			height: that._content.height()
		};
		if (coords.x < offset.left) {
			that._content.scrollPane('scrollByX', coords.x - offset.left, false);
		}
		if (coords.x > offset.left + dimentions.width) {
			that._content.scrollPane('scrollByX', coords.x - offset.left - dimentions.width, false);
		}
		if (coords.y < offset.top) {
			that._content.scrollPane('scrollByY', coords.y - offset.top, false);
		}
		if (coords.yBot > offset.top + dimentions.height) {
			that._content.scrollPane('scrollByY', coords.yBot - offset.top - dimentions.height, false);
		}
	});
	
	this._content.scrollPane({
		autoReload: true,
		expand: true,
		keyUpResize: true,
		alsoResize: this._gedit
	});
	
	this._gedit.appendTo(this._content.scrollPane('content'));
	
	var closeStackLength = 0;
	this._window.bind('windowbeforeclose', function(event) {
		if (closeStackLength > 0) {
			closeStackLength = 0;
			return;
		}
		
		var file = that._gedit.gedit('option', 'file');
		if (!that.saved() && that._gedit.gedit('contents') != '') {
			closeStackLength++;
			var filename = (typeof file != 'undefined' && file != false) ? file.getAttribute('basename') : 'Nouveau fichier';
			var confirm = $.w.window.confirm({
				title: 'Enregistrer les modifications',
				label: 'Voulez-vous enregistrer les modifications du document « '+filename+' » avant de le fermer ?',
				cancel: function() {
					that._window.window('close');
				},
				confirm: function() {
					closeStackLength = 0;
					that.save(new W.Callback(function() {
						that._window.window('close');
					}));
				},
				cancelLabel: 'Fermer sans enregistrer',
				confirmLabel: 'Enregistrer'
			});
			confirm.window('open');
			event.preventDefault();
		}
	});
	
	this._refreshTitle();
	
	this._window.window('open');
	this._content.scrollPane('reload');
}